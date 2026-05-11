import mongoose from 'mongoose';
import BaseRule from '../models/rules/baseRules.js';
import StageRule from '..//models/rules/stageRules.js';
import Bracket from '../models/rules/brackets.js';
import Group from '../models/groups.js';
import Team from '../models/teams.js';
import Match from '../models/matches.js';

export const initializeSportStructure = async (tournamentId, baseRuleId, sportItem, session) => {
    const baseRule = await BaseRule.findById(baseRuleId).populate('tournamentStructure.stages');
    if (!baseRule) throw new Error('BaseRule not found');
    if (baseRule.sport !== sportItem.sport) throw new Error('Sport mismatch');

    const stageRuleId = baseRule.tournamentStructure.stages[0];
    const stageRule = await StageRule.findById(stageRuleId);
    if (!stageRule) throw new Error('StageRule not found');

    // Lấy thông tin thời gian bắt đầu giải (từ tournament)
    const tournament = await Tournament.findById(tournamentId).session(session);
    const baseStartTime = tournament?.timeLine?.timeOpen || new Date();

    for (let idx = 0; idx < stageRule.stages.length; idx++) {
        const stageConfig = stageRule.stages[idx];
        // Tạo Bracket cho stage này
        const bracket = await Bracket.create([{
            tournamentId,
            stageId: stageRule._id,
            sport: sportItem.sport,          // thêm sport
            name: `${sportItem.sport} - ${stageConfig.stageName}`,
            numberOfGroups: stageConfig.type === 'GROUP_STAGE' ? stageConfig.numberOfGroups : 0,
            groups: [],
            placeholderTeams: [],
            totalTeams: stageConfig.type === 'GROUP_STAGE'
                ? stageConfig.numberOfGroups * stageConfig.playersPerGroup
                : (stageConfig.totalSlots || 0),
            currentRound: 0,
            status: 'pending'
        }], { session });
        const bracketId = bracket[0]._id;

        // Cập nhật bracketIds trong StageRule
        await StageRule.findByIdAndUpdate(stageRule._id, { $push: { bracketIds: bracketId } }, { session });

        // ---------- XỬ LÝ VÒNG BẢNG (GROUP_STAGE) ----------
        if (stageConfig.type === 'GROUP_STAGE') {
            const groupIds = [];
            // Tạo từng bảng
            for (let g = 0; g < stageConfig.numberOfGroups; g++) {
                const groupName = `Bảng ${String.fromCharCode(65 + g)}`; // A, B, C,...
                // Tạo các đội placeholder cho bảng
                const teamPlaceholders = [];
                for (let t = 0; t < stageConfig.playersPerGroup; t++) {
                    const team = await Team.create([{
                        tournamentId,
                        name: `Đội ${t + 1} - ${groupName} (${sportItem.sport})`,
                        sport: sportItem.sport,
                        isPlaceholder: true,
                        group: groupName,
                        status: 'pending'
                    }], { session });
                    teamPlaceholders.push(team[0]._id);
                }
                // Tạo Group document
                const group = await Group.create([{
                    name: groupName,
                    tournamentId: tournamentId,
                    bracketId: bracketId,
                    stageRuleId: stageRule._id,
                    sport: sportItem.sport,
                    teamInGroup: teamPlaceholders,
                    standings: {
                        played: 0, wins: 0, draws: 0, losses: 0,
                        goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0
                    },
                    status: 'pending'
                }], { session });
                groupIds.push(group[0]._id);
            }
            // Cập nhật danh sách groups vào bracket
            await Bracket.findByIdAndUpdate(bracketId, { groups: groupIds }, { session });

            // Tạo lịch thi đấu vòng tròn (round robin) cho từng bảng
            let globalMatchNumber = 1;
            for (const groupId of groupIds) {
                const group = await Group.findById(groupId).populate('teamInGroup');
                const teamIds = group.teamInGroup.map(t => t._id);
                // Tạo tất cả các cặp đấu (i vs j)
                for (let i = 0; i < teamIds.length; i++) {
                    for (let j = i + 1; j < teamIds.length; j++) {
                        // Tính thời gian dự kiến: cộng dồn 90 phút mỗi trận (có thể điều chỉnh)
                        const matchStart = new Date(baseStartTime);
                        matchStart.setMinutes(matchStart.getMinutes() + (globalMatchNumber - 1) * 90);
                        await Match.create([{
                            tournamentId,
                            bracketId: bracketId,
                            stageRuleId: stageRule._id,
                            groupId: groupId,
                            round: 1,                         // vòng bảng chỉ có 1 lượt
                            matchNumber: globalMatchNumber++,
                            matchType: 'group',
                            sportType: sportItem.sport,
                            ruleId: baseRuleId,
                            team1: teamIds[i],
                            team2: teamIds[j],
                            scheduledStartTime: matchStart,
                            courtId: null,
                            courtName: '',
                            status: 'SCHEDULED'
                        }], { session });
                    }
                }
            }
        }
        // ---------- XỬ LÝ LOẠI TRỰC TIẾP (KNOCKOUT) ----------
        else if (stageConfig.type === 'KNOCKOUT') {
            const totalSlots = stageConfig.totalSlots || 8;
            // Tạo các đội placeholder cho nhánh đấu
            const placeholderTeamIds = [];
            for (let k = 0; k < totalSlots; k++) {
                const team = await Team.create([{
                    tournamentId,
                    name: `Đội chờ KO ${k + 1} (${sportItem.sport})`,
                    sport: sportItem.sport,
                    isPlaceholder: true,
                    status: 'pending'
                }], { session });
                placeholderTeamIds.push(team[0]._id);
            }
            await Bracket.findByIdAndUpdate(bracketId, { placeholderTeams: placeholderTeamIds }, { session });

            // Tạo các trận đấu theo cây (single elimination)
            let matchesThisRound = totalSlots / 2;
            let round = 1;
            let matchNumber = 1;
            let timeOffset = 0;
            while (matchesThisRound >= 1) {
                for (let m = 0; m < matchesThisRound; m++) {
                    const matchStart = new Date(baseStartTime);
                    matchStart.setMinutes(matchStart.getMinutes() + timeOffset);
                    timeOffset += 90; // mỗi trận 90 phút, có thể điều chỉnh
                    await Match.create([{
                        tournamentId,
                        bracketId: bracketId,
                        stageRuleId: stageRule._id,
                        groupId: null,
                        round: round,
                        matchNumber: matchNumber++,
                        matchType: 'knockout',
                        sportType: sportItem.sport,
                        ruleId: baseRuleId,
                        team1: null,   // sẽ gán sau khi có kết quả vòng trước
                        team2: null,
                        scheduledStartTime: matchStart,
                        courtId: null,
                        courtName: '',
                        status: 'SCHEDULED'
                    }], { session });
                }
                round++;
                matchesThisRound = Math.floor(matchesThisRound / 2);
            }
        }
    }
    return { success: true };
};