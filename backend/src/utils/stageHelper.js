import Group from '../models/groups.js';
import Bracket from '../models/rules/brackets.js';

/**
 * Tạo Group từ cấu hình StageRule
 * @param {Object} stageRule - Document StageRule từ DB
 * @param {ObjectId} tournamentId
 * @param {ObjectId} bracketId (tùy chọn, nếu chưa có sẽ tự tạo)
 * @returns {Array} Danh sách Group đã tạo
 */
export const createGroupsFromStageRule = async (stageRule, tournamentId, bracketId = null) => {
    // Nếu chưa có bracket, tạo mới
    if (!bracketId) {
        const bracket = await Bracket.create({
            tournamentId,
            stageId: stageRule._id,
            sport: stageRule.sportType,
            name: `${stageRule.sportType} - ${stageRule.stageName}`,
            numberOfGroup: 0, // Sẽ cập nhật sau
            groups: []
        });
        bracketId = bracket._id;
    }

    const groups = [];
    
    if (stageRule.type === 'GROUP_STAGE' && stageRule.hasBranches) {
        for (const branch of stageRule.branches) {
            for (let i = 0; i < branch.numberOfGroups; i++) {
                groups.push({
                    name: `${branch.name} - Bảng ${i + 1}`,
                    bracketId,
                    sport: stageRule.sportType,
                    stageRuleId: stageRule._id,
                    tournamentId,
                    teamInGroup: [],
                    standings: [],
                    status: 'pending'
                });
            }
        }
    } else {
        // Trường hợp không có nhánh (1 bảng duy nhất hoặc cấu hình khác)
        const numGroups = stageRule.branches?.[0]?.numberOfGroups || 1;
        for (let i = 0; i < numGroups; i++) {
            groups.push({
                name: `${stageRule.stageName} - Bảng ${i + 1}`,
                bracketId,
                sport: stageRule.sportType,
                stageRuleId: stageRule._id,
                tournamentId,
                teamInGroup: [],
                standings: [],
                status: 'pending'
            });
        }
    }

    const savedGroups = await Group.insertMany(groups);
    
    // Cập nhật bracket với danh sách groups và numberOfGroup
    await Bracket.findByIdAndUpdate(bracketId, {
        numberOfGroup: savedGroups.length,
        $push: { groups: { $each: savedGroups.map(g => g._id) } }
    });

    return savedGroups;
};

/**
 * Lấy danh sách đội đi tiếp từ vòng bảng dựa trên cấu hình
 * @param {Object} stageRule - StageRule của vòng bảng
 * @param {Array} groups - Danh sách Group đã hoàn thành (có standings)
 * @returns {Object} { branchName: [teamId, ...] }
 */
export const getQualifiedTeamsFromGroupStage = (stageRule, groups) => {
    const qualified = {};
    
    if (!stageRule.hasBranches || !stageRule.branches) {
        // Nếu không có nhánh, lấy tất cả đội hoặc theo selectedRanks
        const allTeams = [];
        for (const group of groups) {
            const sorted = sortStandingsForQualification(group.standings, stageRule.rankingCriteria);
            const ranks = stageRule.branches?.[0]?.selectedRanks || [1, 2];
            for (const rank of ranks) {
                const team = sorted[rank - 1];
                if (team) allTeams.push(team.teamId);
            }
        }
        qualified['Default'] = allTeams;
        return qualified;
    }

    // Xử lý từng nhánh
    for (const branch of stageRule.branches) {
        qualified[branch.name] = [];
        
        // Lọc các group thuộc nhánh này
        const branchGroups = groups.filter(g => 
            g.name.startsWith(branch.name) || 
            g.name.includes(branch.name)
        );

        for (const group of branchGroups) {
            const sorted = sortStandingsForQualification(
                group.standings, 
                stageRule.rankingCriteria || stageRule.rankingPriorityOrder
            );
            
            for (const rank of branch.selectedRanks) {
                const team = sorted[rank - 1]; // rank bắt đầu từ 1
                if (team) {
                    qualified[branch.name].push({
                        teamId: team.teamId,
                        groupName: group.name,
                        rank,
                        points: team.points,
                        goalDifference: team.goalDifference
                    });
                }
            }
        }

        // Xử lý wildcard nếu có
        if (stageRule.hasWildcards && stageRule.wildcardsCount > 0) {
            const wildcards = getWildcardTeams(
                branchGroups, 
                qualified[branch.name].map(q => q.teamId.toString()),
                stageRule.wildcardsCount,
                stageRule.wildcardCriteria || stageRule.wildcardPriorityOrder,
                branch.selectedRanks
            );
            qualified[branch.name].push(...wildcards);
        }
    }

    return qualified;
};

/**
 * Sắp xếp standings theo tiêu chí
 */
const sortStandingsForQualification = (standings, criteria = []) => {
    return [...standings].sort((a, b) => {
        for (const criterion of criteria) {
            let result = 0;
            switch (criterion) {
                case 'points':
                    result = (b.points || 0) - (a.points || 0);
                    break;
                case 'pointDiff':
                case 'goalDifference':
                    result = (b.goalDifference || 0) - (a.goalDifference || 0);
                    break;
                case 'totalScore':
                case 'goalsFor':
                    result = (b.goalsFor || 0) - (a.goalsFor || 0);
                    break;
                case 'headToHead':
                    // Cần match data để tính, tạm thời bỏ qua
                    result = 0;
                    break;
                case 'random':
                    result = Math.random() - 0.5;
                    break;
            }
            if (result !== 0) return result;
        }
        return 0;
    });
};

/**
 * Chọn đội wildcard dựa trên tiêu chí
 */
const getWildcardTeams = (branchGroups, qualifiedTeamIds, wildcardCount, criteria, selectedRanks) => {
    const candidates = [];
    
    for (const group of branchGroups) {
        const sorted = sortStandingsForQualification(group.standings, criteria);
        for (let i = 0; i < sorted.length; i++) {
            const rank = i + 1;
            // Bỏ qua các rank đã được chọn trực tiếp
            if (selectedRanks.includes(rank)) continue;
            
            const teamIdStr = sorted[i].teamId.toString();
            // Bỏ qua nếu đã qualified
            if (qualifiedTeamIds.includes(teamIdStr)) continue;
            
            candidates.push({
                ...sorted[i],
                groupName: group.name,
                rank
            });
        }
    }

    // Sắp xếp candidates theo criteria và lấy wildcardCount đội
    const sortedCandidates = sortStandingsForQualification(
        candidates.map(c => ({
            teamId: c.teamId,
            points: c.points,
            goalDifference: c.goalDifference,
            goalsFor: c.goalsFor
        })),
        criteria
    );

    return sortedCandidates.slice(0, wildcardCount).map(c => ({
        teamId: c.teamId,
        isWildcard: true
    }));
};

/**
 * Tạo lịch knock-out từ substage
 * @param {Object} substage - Cấu hình substage
 * @param {Array} teams - Danh sách teamId
 * @param {Object} options - { tournamentId, bracketId, sportType, ruleId, startTime, courts }
 * @returns {Array} Danh sách match
 */
export const createKnockoutMatchesFromSubstage = (substage, teams, options) => {
    const matches = [];
    const { tournamentId, bracketId, sportType, ruleId, startTime, courts = [] } = options;
    const matchDurationMinutes = Number(substage.matchDuration || options.matchDuration || 60);
    
    const totalTeams = substage.totalTeamsIn || teams.length;
    const numMatches = Math.floor(totalTeams / 2);
    
    // Nếu số đội thực tế ít hơn totalTeamsIn, thêm bye (tạm thời để trống team2)
    const availableTeams = [...teams];
    
    for (let i = 0; i < numMatches; i++) {
        const scheduledTime = startTime 
            ? new Date(new Date(startTime).getTime() + i * matchDurationMinutes * 60 * 1000) 
            : null;
        
        matches.push({
            tournamentId,
            bracketId,
            stageRuleId: substage._id || options.stageRuleId,
            round: Number(substage.stageNumber || substage.round || substage.roundNumber) || 2,
            roundName: substage.knockoutRound || substage.stageName || `Round ${i + 1}`,
            matchNumber: i + 1,
            matchType: 'knockout',
            sportType,
            ruleId,
            team1: availableTeams[i * 2] || null,
            team2: availableTeams[i * 2 + 1] || null,
            scheduledStartTime: scheduledTime,
            courtName: courts[i % courts.length] || '',
            status: 'SCHEDULED'
        });
    }

    return matches;
};

/**
 * Đệ quy tạo toàn bộ lịch knock-out từ substages
 */
const getRoundName = (roundIndex, totalRounds) => {
    const roundsLeft = totalRounds - roundIndex - 1;
    if (roundsLeft === 0) return 'Chung ket';
    if (roundsLeft === 1) return 'Ban ket';
    if (roundsLeft === 2) return 'Tu ket';
    return `Knockout vong ${roundIndex + 1}`;
};

const buildFullKnockoutStages = (firstStage, teamsLength) => {
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(Math.max(2, firstStage.totalTeamsIn || teamsLength || 2))));
    const totalRounds = Math.ceil(Math.log2(bracketSize));
    const startRound = Number(firstStage.stageNumber || firstStage.round || firstStage.roundNumber) || 2;

    return Array.from({ length: totalRounds }, (_, roundIndex) => {
        const totalTeamsIn = bracketSize / Math.pow(2, roundIndex);
        const round = startRound + roundIndex;
        const roundName = getRoundName(roundIndex, totalRounds);
        return {
            ...firstStage,
            stageNumber: round,
            round,
            totalTeamsIn,
            stageName: roundName,
            knockoutRound: roundName,
            substages: [],
        };
    });
};

export const createAllKnockoutMatches = (substages, teamsByBranch, options) => {
    let allMatches = [];
    let matchNumber = 1;
    const matchDurationMinutes = Number(options.matchDuration || 60);
    const startTimeMs = options.startTime ? new Date(options.startTime).getTime() : null;
    const courts = options.courts || [];
    
    const processSubstage = (substages, teams) => {
        const matches = [];
        const stagesToProcess = substages.length === 1 && (!substages[0].substages || substages[0].substages.length === 0)
            ? buildFullKnockoutStages(substages[0], teams.length)
            : substages;

        for (let stageIndex = 0; stageIndex < stagesToProcess.length; stageIndex++) {
            const substage = stagesToProcess[stageIndex];
            const numTeams = substage.totalTeamsIn || teams.length;
            const numMatches = Math.floor(numTeams / 2);
            const stageTeams = stageIndex === 0 ? teams.slice(0, numTeams) : Array(numTeams).fill(null);
            
            const substageMatches = createKnockoutMatchesFromSubstage(
                substage, 
                stageTeams,
                { ...options }
            );
            
            // Đánh lại matchNumber
            substageMatches.forEach(m => {
                const currentMatchNumber = matchNumber++;
                m.matchNumber = currentMatchNumber;
                m.parentSubstageId = substage._id;
                m.substageName = substage.stageName;
                m.matchName = `R${m.round}-M${currentMatchNumber}`;
                if (startTimeMs) {
                    m.scheduledStartTime = new Date(startTimeMs + (currentMatchNumber - 1) * matchDurationMinutes * 60 * 1000);
                }
                if (courts.length) {
                    m.courtName = courts[(currentMatchNumber - 1) % courts.length];
                }
            });
            
            matches.push(...substageMatches);
            
            // Đệ quy substages con
            if (substage.substages && substage.substages.length > 0) {
                // Giả định số đội thắng = numMatches
                const winners = Array(numMatches).fill(null);
                const childMatches = processSubstage(substage.substages, winners);
                matches.push(...childMatches);
            }
        }
        return matches;
    };

    if (Array.isArray(substages)) {
        // Nhiều substage (có thể là các nhánh khác nhau)
        for (const [branchName, teams] of Object.entries(teamsByBranch)) {
            const branchSubstages = substages.filter(s => 
                s.stageName?.includes(branchName) || s.branches?.[0]?.name === branchName
            );
            if (branchSubstages.length > 0) {
                allMatches.push(...processSubstage(branchSubstages, teams));
            } else {
                // Nếu không tìm thấy substage riêng, dùng substage đầu tiên
                allMatches.push(...processSubstage([substages[0]], teams));
            }
        }
    } else {
        allMatches = processSubstage([substages], Object.values(teamsByBranch)[0]);
    }

    return allMatches;
};
