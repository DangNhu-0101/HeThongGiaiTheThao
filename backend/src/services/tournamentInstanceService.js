// services/tournamentStructureService.js
import mongoose from 'mongoose';
import BaseRule from '../models/rules/baseRules.js';
import StageRule from '../models/rules/stageRules.js';
import Bracket from '../models/rules/brackets.js';
import Group from '../models/groups.js';

export const initializeSportStructure = async (tournamentId, baseRuleId, sportItem, session) => {
    const baseRule = await BaseRule.findById(baseRuleId).populate('tournamentStructure.stages');
    if (!baseRule) throw new Error('BaseRule not found');
    if (baseRule.sport !== sportItem.sport) throw new Error('Sport mismatch');

    const stageRuleId = baseRule.tournamentStructure.stages[0];
    const stageRule = await StageRule.findById(stageRuleId);
    if (!stageRule) throw new Error('StageRule not found');

    for (let idx = 0; idx < stageRule.stages.length; idx++) {
        const stageConfig = stageRule.stages[idx];
        // Tạo Bracket cho stage này
        const bracket = await Bracket.create([{
            tournamentId,
            stageId: stageRule._id,
            sport: sportItem.sport,
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

        // Xử lý GROUP_STAGE: chỉ tạo các group rỗng
        if (stageConfig.type === 'GROUP_STAGE') {
            const groupIds = [];
            for (let g = 0; g < stageConfig.numberOfGroups; g++) {
                const groupName = `Bảng ${String.fromCharCode(65 + g)}`;
                // Tạo Group rỗng (teamInGroup = [], standings = [])
                const group = await Group.create([{
                    name: groupName,
                    tournamentId: tournamentId,
                    bracketId: bracketId,
                    stageRuleId: stageRule._id,
                    sport: sportItem.sport,
                    teamInGroup: [],
                    standings: [],
                    status: 'pending'
                }], { session });
                groupIds.push(group[0]._id);
            }
            await Bracket.findByIdAndUpdate(bracketId, { groups: groupIds }, { session });
        }
    }
    return { success: true };
};