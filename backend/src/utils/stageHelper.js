import Group from '../models/groups.js';
import Bracket from '../models/rules/brackets.js';

const getEntryTeamId = (entry) => {
    if (!entry) return null;
    if (typeof entry === 'object' && 'teamId' in entry) return entry.teamId || null;
    return entry;
};
const getEntryName = (entry, fallback) => entry?.placeholderName || entry?.name || fallback;
const getEntrySlotCode = (entry, fallback) => entry?.slotCode || fallback;

export const createGroupsFromStageRule = async (stageRule, tournamentId, bracketId = null) => {
    let resolvedBracketId = bracketId;

    if (!resolvedBracketId) {
        const bracket = await Bracket.create({
            tournamentId,
            stageId: stageRule._id,
            sport: stageRule.sportType,
            name: `${stageRule.sportType} - ${stageRule.stageName}`,
            numberOfGroup: 0,
            groups: []
        });
        resolvedBracketId = bracket._id;
    }

    const groups = [];

    if (stageRule.type === 'GROUP_STAGE' && stageRule.hasBranches) {
        for (const branch of stageRule.branches || []) {
            for (let i = 0; i < Number(branch.numberOfGroups || 1); i++) {
                groups.push({
                    name: `${branch.name || 'Nhánh chính'} - Bảng ${i + 1}`,
                    bracketId: resolvedBracketId,
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
        const numGroups = Number(stageRule.branches?.[0]?.numberOfGroups || stageRule.numberOfGroups || 1);
        for (let i = 0; i < numGroups; i++) {
            groups.push({
                name: `${stageRule.stageName || 'Vòng bảng'} - Bảng ${i + 1}`,
                bracketId: resolvedBracketId,
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

    await Bracket.findByIdAndUpdate(resolvedBracketId, {
        numberOfGroup: savedGroups.length,
        $push: { groups: { $each: savedGroups.map(g => g._id) } }
    });

    return savedGroups;
};

export const getQualifiedTeamsFromGroupStage = (stageRule, groups) => {
    const qualified = {};
    const rankingCriteria = stageRule.rankingCriteria || stageRule.rankingPriorityOrder || [];

    if (!stageRule.hasBranches || !stageRule.branches?.length) {
        const allTeams = [];
        const ranks = stageRule.branches?.[0]?.selectedRanks || stageRule.selectedRanks || [1, 2];

        for (const group of groups) {
            const sorted = sortStandingsForQualification(group.standings || [], rankingCriteria);
            for (const rank of ranks) {
                const team = sorted[rank - 1];
                if (team) {
                    allTeams.push({
                        teamId: team.teamId,
                        placeholderName: team.placeholderName,
                        slotCode: team.slotCode,
                        groupName: group.name,
                        rank,
                        points: team.points,
                        goalDifference: team.goalDifference
                    });
                }
            }
        }

        qualified['Nhánh chính'] = allTeams;
        return qualified;
    }

    for (const branch of stageRule.branches) {
        const selectedRanks = branch.selectedRanks?.length ? branch.selectedRanks : [1, 2];
        qualified[branch.name] = [];

        const branchGroups = groups.filter(g =>
            g.name.startsWith(branch.name) ||
            g.name.includes(branch.name)
        );

        for (const group of branchGroups) {
            const sorted = sortStandingsForQualification(group.standings || [], rankingCriteria);

            for (const rank of selectedRanks) {
                const team = sorted[rank - 1];
                if (team) {
                    qualified[branch.name].push({
                        teamId: team.teamId,
                        placeholderName: team.placeholderName,
                        slotCode: team.slotCode,
                        groupName: group.name,
                        rank,
                        points: team.points,
                        goalDifference: team.goalDifference
                    });
                }
            }
        }

        if (stageRule.hasWildcards && stageRule.wildcardsCount > 0) {
            const wildcards = getWildcardTeams(
                branchGroups,
                qualified[branch.name].map(q => q.teamId?.toString()).filter(Boolean),
                stageRule.wildcardsCount,
                stageRule.wildcardCriteria || stageRule.wildcardPriorityOrder || rankingCriteria,
                selectedRanks
            );
            qualified[branch.name].push(...wildcards);
        }
    }

    return qualified;
};

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
                    result = 0;
                    break;
                case 'random':
                    result = Math.random() - 0.5;
                    break;
            }
            if (result !== 0) return result;
        }
        return (a.rank || 0) - (b.rank || 0);
    });
};

const getWildcardTeams = (branchGroups, qualifiedTeamIds, wildcardCount, criteria, selectedRanks) => {
    const candidates = [];

    for (const group of branchGroups) {
        const sorted = sortStandingsForQualification(group.standings || [], criteria);
        for (let i = 0; i < sorted.length; i++) {
            const rank = i + 1;
            if (selectedRanks.includes(rank)) continue;

            const teamIdStr = sorted[i].teamId?.toString();
            if (teamIdStr && qualifiedTeamIds.includes(teamIdStr)) continue;

            candidates.push({
                ...sorted[i],
                groupName: group.name,
                rank
            });
        }
    }

    const sortedCandidates = sortStandingsForQualification(candidates, criteria);

    return sortedCandidates.slice(0, wildcardCount).map(c => ({
        teamId: c.teamId,
        placeholderName: c.placeholderName,
        slotCode: c.slotCode,
        groupName: c.groupName,
        rank: c.rank,
        points: c.points,
        goalDifference: c.goalDifference,
        isWildcard: true
    }));
};

export const createKnockoutMatchesFromSubstage = (substage, teams, options) => {
    const matches = [];
    const { tournamentId, bracketId, sportType, ruleId, startTime, courts = [] } = options;
    const matchDurationMinutes = Number(substage.matchDuration || options.matchDuration || 60);
    const totalTeams = substage.totalTeamsIn || teams.length;
    const numMatches = Math.floor(totalTeams / 2);
    const availableTeams = [...teams];

    for (let i = 0; i < numMatches; i++) {
        const scheduledTime = startTime
            ? new Date(new Date(startTime).getTime() + i * matchDurationMinutes * 60 * 1000)
            : null;

        matches.push({
            tournamentId,
            bracketId,
            stageRuleId: options.stageRuleId || substage._id,
            round: Number(substage.stageNumber || substage.round || substage.roundNumber) || 2,
            roundName: substage.knockoutRound || substage.stageName || `Vòng ${i + 1}`,
            matchNumber: i + 1,
            matchType: 'knockout',
            sportType,
            ruleId,
            team1: getEntryTeamId(availableTeams[i * 2]),
            team2: getEntryTeamId(availableTeams[i * 2 + 1]),
            team1Name: getEntryName(availableTeams[i * 2], `Team ${i * 2 + 1}`),
            team2Name: getEntryName(availableTeams[i * 2 + 1], `Team ${i * 2 + 2}`),
            team1SlotCode: getEntrySlotCode(availableTeams[i * 2], ''),
            team2SlotCode: getEntrySlotCode(availableTeams[i * 2 + 1], ''),
            scheduledStartTime: scheduledTime,
            courtName: courts[i % courts.length] || '',
            status: 'SCHEDULED'
        });
    }

    return matches;
};

const getRoundName = (roundIndex, totalRounds) => {
    const roundsLeft = totalRounds - roundIndex - 1;
    if (roundsLeft === 0) return 'Chung kết';
    if (roundsLeft === 1) return 'Bán kết';
    if (roundsLeft === 2) return 'Tứ kết';
    return `Vòng knock-out ${roundIndex + 1}`;
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

const wireWinnerTargets = (matches) => {
    const byRound = new Map();
    matches.forEach((match) => {
        if (!byRound.has(match.round)) byRound.set(match.round, []);
        byRound.get(match.round).push(match);
    });

    const rounds = Array.from(byRound.keys()).sort((a, b) => a - b);
    rounds.forEach((round, roundIndex) => {
        const currentRound = byRound.get(round).sort((a, b) => a.matchNumber - b.matchNumber);
        const nextRound = byRound.get(rounds[roundIndex + 1])?.sort((a, b) => a.matchNumber - b.matchNumber);

        currentRound.forEach((match, matchIndex) => {
            if (!nextRound?.length) {
                match.winnerTarget = 'Vô địch';
                match.loserTarget = 'Loại';
                return;
            }

            const nextMatch = nextRound[Math.floor(matchIndex / 2)];
            const nextSide = matchIndex % 2 === 0 ? 1 : 2;
            match.nextMatchNumber = nextMatch.matchNumber;
            match.nextMatchSide = nextSide;
            match.winnerTarget = `${nextMatch.slotCode}-${nextSide}`;
            match.loserTarget = 'Loại';
        });
    });

    return matches;
};

export const createAllKnockoutMatches = (substages, teamsByBranch, options) => {
    let allMatches = [];
    let matchNumber = 1;
    const matchDurationMinutes = Number(options.matchDuration || 60);
    const startTimeMs = options.startTime ? new Date(options.startTime).getTime() : null;
    const courts = options.courts || [];

    const processSubstage = (stages, teams, branchNo = 1) => {
        const matches = [];
        const stagesToProcess = stages.length === 1 && (!stages[0].substages || stages[0].substages.length === 0)
            ? buildFullKnockoutStages(stages[0], teams.length)
            : stages;

        for (let stageIndex = 0; stageIndex < stagesToProcess.length; stageIndex++) {
            const substage = stagesToProcess[stageIndex];
            const numTeams = substage.totalTeamsIn || teams.length;
            const numMatches = Math.floor(numTeams / 2);
            const stageTeams = stageIndex === 0 ? teams.slice(0, numTeams) : Array(numTeams).fill(null);
            const substageMatches = createKnockoutMatchesFromSubstage(substage, stageTeams, { ...options });

            substageMatches.forEach(match => {
                const currentMatchNumber = matchNumber++;
                match.matchNumber = currentMatchNumber;
                match.parentSubstageId = substage._id;
                match.substageName = substage.stageName;
                match.matchName = `R${match.round}-M${currentMatchNumber}`;
                match.slotCode = `R${match.round}-B${branchNo}-M${currentMatchNumber}`;
                if (!match.team1SlotCode) match.team1SlotCode = `${match.slotCode}-1`;
                if (!match.team2SlotCode) match.team2SlotCode = `${match.slotCode}-2`;
                if (startTimeMs) {
                    match.scheduledStartTime = new Date(startTimeMs + (currentMatchNumber - 1) * matchDurationMinutes * 60 * 1000);
                }
                if (courts.length) {
                    match.courtName = courts[(currentMatchNumber - 1) % courts.length];
                }
            });

            matches.push(...substageMatches);

            if (substage.substages?.length) {
                const winners = Array(numMatches).fill(null);
                matches.push(...processSubstage(substage.substages, winners, branchNo));
            }
        }

        return wireWinnerTargets(matches);
    };

    if (Array.isArray(substages)) {
        const branchNames = Object.keys(teamsByBranch);
        for (const [branchName, teams] of Object.entries(teamsByBranch)) {
            const branchIndex = branchNames.indexOf(branchName) + 1;
            const branchSubstages = substages.filter(stage =>
                stage.stageName?.includes(branchName) || stage.branches?.[0]?.name === branchName
            );
            allMatches.push(...processSubstage(branchSubstages.length ? branchSubstages : [substages[0]], teams, branchIndex));
        }
    } else {
        allMatches = processSubstage([substages], Object.values(teamsByBranch)[0] || []);
    }

    return allMatches;
};
