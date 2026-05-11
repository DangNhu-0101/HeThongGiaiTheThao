import mongoose from "mongoose";
import BaseRule from "../models/rules/baseRules.js";
import ScoringRule from "../models/rules/scoringRules.js";
import StageRule from "../models/rules/stageRules.js";
import CategoryRule from "../models/rules/categories.js";
import GameRule from "../models/rules/gameRules.js";
import TimeManagementRule from "../models/rules/timeManagements.js";
import ResourceManagementRule from "../models/rules/resourceManagements.js";
import FaultsAndPenalties from "../models/rules/faultsAndPenalties.js";
import Bracket from "../models/rules/brackets.js";
import Team from "../models/teams.js";
import Group from "../models/groups.js";

export const createRuleServices = async (data, tournamentId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Tạo các rule con (không phụ thuộc lẫn nhau)
        const [
            scoringRule,
            categoryRules,
            gameRules,
            timeRules,
            resourceRules,
            faultRules
        ] = await Promise.all([
            ScoringRule.create([data.scoringConfig], { session }),
            data.categoryConfig ? CategoryRule.insertMany(data.categoryConfig, { session }) : [],
            data.gameConfig ? GameRule.insertMany(data.gameConfig, { session }) : [],
            data.timeManagementConfig ? TimeManagementRule.insertMany(data.timeManagementConfig, { session }) : [],
            data.resourceManagementConfig ? ResourceManagementRule.insertMany(data.resourceManagementConfig, { session }) : [],
            data.faultAndPenaltyConfig ? FaultsAndPenalties.insertMany(data.faultAndPenaltyConfig, { session }) : []
        ]);

        // 2. Tạo Bracket TRƯỚC (vì StageRule cần reference đến bracket)
        const bracketRule = await Bracket.create([{
            ...data.bracketConfig,
            tournamentId,
            numberOfGroups: data.stages?.find(s => s.type === 'GROUP_STAGE')?.numberOfGroups || 0,
            placeholderTeams: [] // sẽ update sau
        }], { session });

        // 3. Tạo StageRule (có bracketId)
        const stageRule = await StageRule.create([{
            tournamentId,
            baseRuleId: null, // sẽ update sau
            sport: data.sport,
            ruleName: data.ruleName,
            scoringRuleId: scoringRule[0]._id,
            stages: data.stages,
            bracketSize: [bracketRule[0]._id]
        }], { session });

        // 4. Tạo BaseRule (cuối cùng, sau khi có stageId và bracketId)
        const baseRule = await BaseRule.create([{
            ...data.baseConfig,
            tournamentId,
            ruleName: data.ruleName,
            sportType: data.sport,
            version: data.version || "1.0",
            language: data.language || "vi",
            tournamentStructure: {
                categories: categoryRules.map(c => c._id),
                stages: [stageRule[0]._id],
                scoringRule: scoringRule[0]._id
            },
            gameRules: gameRules.map(g => g._id),
            timeManagement: timeRules.map(t => t._id),
            resourceManagement: resourceRules.map(r => r._id),
            faultsAndPenalties: faultRules.map(f => f._id),
            bracketId: bracketRule[0]._id
        }], { session });

        // 5. Cập nhật stageRule với baseRuleId
        await StageRule.findByIdAndUpdate(
            stageRule[0]._id,
            { baseRuleId: baseRule[0]._id },
            { session }
        );

        // 6. Tạo đội mặc định cho các bảng
        for (const stage of data.stages) {
            // VÒNG BẢNG
            if (stage.type === 'GROUP_STAGE' || stage.type === 'ROUND_ROBIN') {
                const groupIds = [];

                for (let i = 0; i < stage.numberOfGroups; i++) {
                    const groupName = `Bảng ${String.fromCharCode(65 + i)}`;

                    // Tạo đội cho bảng này
                    const teams = Array.from({ length: stage.playersPerGroup || 4 }).map((_, j) => ({
                        tournamentId,
                        name: `Đội ${j + 1} - ${groupName}`,
                        isPlaceholder: true,
                        group: groupName
                    }));

                    const savedTeams = await Team.insertMany(teams, { session });

                    // Tạo Group
                    const newGroup = await Group.create([{
                        name: groupName,
                        bracketId: bracketRule[0]._id,
                        stageRuleId: stageRule[0]._id,
                        teamInGroup: savedTeams.map(t => t._id)
                    }], { session });

                    groupIds.push(newGroup[0]._id);
                }

                // Cập nhật danh sách groups vào Bracket
                await Bracket.findByIdAndUpdate(
                    bracketRule[0]._id,
                    { $push: { groups: { $each: groupIds } } },
                    { session }
                );
            }

            // VÒNG KNOCKOUT
            if (stage.type === 'KNOCKOUT') {
                const totalTeamsInBracket = data.bracketConfig?.totalTeams || 8;

                const knockoutTeams = Array.from({ length: totalTeamsInBracket }).map((_, j) => ({
                    tournamentId,
                    name: `Đội chờ ${j + 1} - ${stage.stageName}`,
                    isPlaceholder: true,
                    stage: stage.stageName
                }));

                const savedKnockoutTeams = await Team.insertMany(knockoutTeams, { session });

                // Cập nhật danh sách đội vào Bracket
                await Bracket.findByIdAndUpdate(
                    bracketRule[0]._id,
                    {
                        $push: {
                            placeholderTeams: { $each: savedKnockoutTeams.map(t => t._id) }
                        }
                    },
                    { session }
                );
            }
        }

        await session.commitTransaction();

        return {
            success: true,
            baseRule: baseRule[0],
            stageRule: stageRule[0],
            bracket: bracketRule[0],
            message: "Tạo cấu trúc rule thành công"
        };

    } catch (error) {
        await session.abortTransaction();
        console.error("Lỗi quy trình tạo cấu trúc tầng:", error);
        throw error;
    } finally {
        session.endSession();
    }
};