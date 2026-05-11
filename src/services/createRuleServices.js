import mongoose from "mongoose";
import BaseRule from "../models/Rule/baseRules.js";
import ScoringRule from "../models/Rule/scoringRules.js";
import StageRule from "../models/Rule/stageRules.js";
import CategoryRule from "../models/Rule/categoryRules.js";
import GameRule from "../models/Rule/gameRules.js";
import TimeManagementRule from "../models/Rule/timeManagementRules.js";
import ResourceManagementRule from "../models/Rule/resourceManagementRules.js";
import FaultsAndPenalties from "../models/Rule/faultsAndPenalties.js";
import Bracket from "../models/bracket.js";
import Team from "../models/teams.js";
import Group from "../models/tables.js";

export const createRuleServices = async (data, tournamentId) => {
    const session = await mongoose.startSession();
    session.startTransaction(); 
        try {
            const [
                scoringRule,
                categories,
                games,
                times,
                resources,
                faults
            ] = await Promise.all([
                new ScoringRule(data.scoringConfig).save({ session }),
                CategoryRule.insertMany(data.categoryConfig || [], { session }),
                GameRule.insertMany(data.gameConfig || [], { session }),
                TimeManagementRule.insertMany(data.timeManagementConfig || [], { session }),
                ResourceManagementRule.insertMany(data.resourceManagementConfig || [], { session }),
                FaultAndPenaltyRule.insertMany(data.faultAndPenaltyConfig || [], { session })
            ]);

            // tao baseRule
            const baseRuleArray = await BaseRule.create([{
                ...data.baseConfig,
                tournamentId,
                tournamentStructure: {
                    stages: [stageRule._id],
                    ScoringRule: scoringRule._id
                }
            }], { session });
        

        // taoj stage
        const stageRule = await new StageRule({
            tournamentId,
            baseRuleId: baseRuleArray[0]._id,
            sport: data.sport,
            ruleName: data.ruleName,
            ScoringRule: scoringRule._id,
            stages: data.stages, // Dữ liệu chứa numberOfGroups
            bracketSize: [bracketRule._id]
        }).save({ session });

            // Tạo Bracket Rule (Nhánh) 
            const bracketRule = await new Bracket({
                ...data.bracketConfig,
                tournamentId,
                numberOfGroup: data.stages[0]?.numberOfGroups || 0,
                stageId
            }).save({ session });

            // tìm loại stage để tạo đội default
            for (const stage of data.stages) {

                //  VÒNG BẢNG (GROUP_STAGE)
                if (stage.type === 'GROUP_STAGE' || stage.type === 'ROUND_ROBIN') {
                    for (let i = 0; i < stage.numberOfGroups; i++) {
                        const groupName = `Bảng ${String.fromCharCode(65 + i)}`;
                        const newGroup = await new Group({
                            name: groupName,
                            bracketId: bracketRule._id,
                            stageRuleId: stageRule._id
                        }).save({ session });

                        // Tạo đội cho từng bảng
                        const teams = Array.from({ length: stage.playersPerGroup }).map((_, j) => ({
                            tournamentId,
                            name: `Đội ${j + 1} - ${groupName}`,
                            isPlaceholder: true
                        }));
                        const savedTeams = await Team.insertMany(teams, { session });

                        newGroup.teamInGroup = savedTeams.map(t => t._id);
                        await newGroup.save({ session });
                    }
                }


                if (stage.type === 'KNOCKOUT') {
                    const totalTeamsInBracket = data.bracketConfig?.totalTeams || 8;

                    const knockoutTeams = Array.from({ length: totalTeamsInBracket }).map((_, j) => ({
                        tournamentId,
                        name: `Đội chờ ${j + 1} - Nhánh ${stage.stageName}`,
                        isPlaceholder: true
                    }));

                    const savedKnockoutTeams = await Team.insertMany(knockoutTeams, { session });

                    // Cập nhật danh sách đội vào Bracket thực tế (Nếu Model Bracket của bạn có trường chứa teams)
                    await Bracket.findByIdAndUpdate(
                        bracketRule._id,
                        { $push: { placeholderTeams: { $each: savedKnockoutTeams.map(t => t._id) } } },
                        { session }
                    );
                }
            }

            await session.commitTransaction();
            return {
                baseRule: baseRuleArray[0],
                stageRuleId: stageRule._id,
                bracketId: bracketRule._id
            };

    } catch (error) {
        await session.abortTransaction();
        console.error("Lỗi quy trình tạo cấu trúc tầng:", error);
        throw error;
    } finally {
        session.endSession();
    }
};
