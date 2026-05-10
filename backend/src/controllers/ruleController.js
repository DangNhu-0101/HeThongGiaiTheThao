// controllers/ruleController.js
import BaseRule from '../models/Rule/baseRules.js';
import StageRule from '../models/Rule/stageRules.js';
import ScoringRule from '../models/Rule/scoringRules.js';
import GameRule from '../models/Rule/gameRules.js';
import CategoryRule from '../models/Rule/categoryRules.js';
import TimeManagementRule from '../models/Rule/timeManagementRules.js';
import ResourceManagementRule from '../models/Rule/resourceManagementRules.js';
import FaultsAndPenalties from '../models/Rule/faultsAndPenalties.js';
import Tournament from '../models/tournament.js';
import Bracket from '../models/bracket.js';
import Group from '../models/tables.js';
import Match from '../models/match.js';
import Team from '../models/teams.js';
import { initializeSportStructure } from '../services/tournamentStructureService.js';

export const getBaseRules = async (req, res) => {
    try {
        const { sport } = req.query;
        let filter = {};
        if (sport) filter.sport = { $regex: new RegExp(`^${sport}$`, 'i') };

        const rules = await BaseRule.find(filter)
            .populate('tournamentStructure.stages')
            .populate('tournamentStructure.scoringRules')
            .lean();

        return res.status(200).json({ success: true, count: rules.length, data: rules });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/rules?tournamentId=...
export const getAllRules = async (req, res) => {
    try {
        const { tournamentId } = req.query;
        let filter = {};
        if (tournamentId) filter.tournamentId = tournamentId;

        const rules = await BaseRule.find(filter)
            .populate({
                path: 'tournamentStructure.stages',
                model: 'StageRule',
                populate: { path: 'scoringRuleId', model: 'ScoringRule' }
            })
            .populate('tournamentStructure.scoringRules')
            .populate('tournamentStructure.gameRules')
            .populate('tournamentStructure.categories')
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({ success: true, count: rules.length, data: rules });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/rules/:id
export const getDetailRules = async (req, res) => {
    try {
        const { id } = req.params;
        const rule = await BaseRule.findById(id)
            .populate({
                path: 'tournamentStructure.stages',
                model: 'StageRule',
                populate: { path: 'scoringRuleId', model: 'ScoringRule' }
            })
            .populate('tournamentStructure.scoringRules')
            .populate('tournamentStructure.gameRules')
            .populate('tournamentStructure.categories')
            .lean();

        if (!rule) return res.status(404).json({ success: false, message: 'Không tìm thấy bộ luật.' });
        return res.status(200).json({ success: true, data: rule });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/rules/:id (chỉ cho phép sửa một số trường an toàn)
export const editRule = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        const newData = req.body; // chứa toàn bộ cấu hình rule mới

        // 1. Tìm BaseRule cũ và tournament liên quan
        const baseRule = await BaseRule.findById(id);
        if (!baseRule) throw new Error('Rule not found');
        const tournament = await Tournament.findById(baseRule.tournamentId).session(session);
        ìf(!tournament)
        {
            return res.status(404).json({ success: false, message: "Không tìm thấy giải đấu liên quan đến bộ luật này." });
        }

        if (tournament && !['upcoming'].includes(tournament.status)) {
           return res.status(400).json({ success: false, message: "Giải đấu đã bắt đầu hoặc kết thúc, không thể chỉnh sửa bộ luật." });
        }

        // 2. Cập nhật các trường đơn giản của BaseRule
        baseRule.ruleName = newData.ruleName;
        baseRule.description = newData.description;
        baseRule.sport = newData.sport;
        baseRule.feeEntry = newData.feeEntry;
        if (newData.teamComposition) baseRule.teamComposition = newData.teamComposition;
        // (có thể thêm version, language nếu cần)

        // 3. Cập nhật hoặc tạo mới ScoringRule (mỗi BaseRule chỉ có một ScoringRule)
        let scoringRuleId = baseRule.tournamentStructure?.scoringRules?.[0];
        if (newData.scoringConfig) {
            if (scoringRuleId) {
                await ScoringRule.findByIdAndUpdate(scoringRuleId, newData.scoringConfig, { session, runValidators: true });
            } else {
                const [newScoring] = await ScoringRule.create([newData.scoringConfig], { session });
                scoringRuleId = newScoring._id;
            }
        }

        // 4. Cập nhật CategoryRules (mảng) - xử lý đồng bộ: giữ lại các id cũ nếu có, thêm mới, xóa những cái không còn
        let newCategoryIds = [];
        if (newData.categoryConfig) {
            const oldCategoryIds = baseRule.tournamentStructure?.categories || [];
            // Tạo map từ id cũ đến document (nếu có) để update
            const oldCategories = await CategoryRule.find({ _id: { $in: oldCategoryIds } }).session(session);
            const oldMap = new Map(oldCategories.map(c => [c._id.toString(), c]));
            // Duyệt qua từng category config mới
            for (const catConfig of newData.categoryConfig) {
                if (catConfig._id && oldMap.has(catConfig._id)) {
                    // Cập nhật category cũ
                    await CategoryRule.findByIdAndUpdate(catConfig._id, catConfig, { session, runValidators: true });
                    newCategoryIds.push(catConfig._id);
                    oldMap.delete(catConfig._id);
                } else {
                    // Tạo mới category
                    const [newCat] = await CategoryRule.create([catConfig], { session });
                    newCategoryIds.push(newCat._id);
                }
            }
            // Những category cũ không còn trong config mới thì xóa
            const toDeleteIds = [...oldMap.keys()];
            if (toDeleteIds.length) {
                await CategoryRule.deleteMany({ _id: { $in: toDeleteIds } }, { session });
            }
        } else {
            // Nếu không có categoryConfig mới, giữ nguyên hoặc xóa hết? Ở đây giữ nguyên
            newCategoryIds = baseRule.tournamentStructure?.categories || [];
        }

        // 5. Tương tự cho GameRules, TimeManagementRules, ResourceManagementRules, FaultsAndPenalties
        // Viết hàm helper hoặc lặp lại cấu trúc tương tự. Để tránh dài dòng, tôi tóm tắt:
        const updateArrayRule = async (model, oldIds, newConfigs, session) => {
            const oldDocs = await model.find({ _id: { $in: oldIds } }).session(session);
            const oldMap = new Map(oldDocs.map(d => [d._id.toString(), d]));
            const newIds = [];
            for (const config of newConfigs) {
                if (config._id && oldMap.has(config._id)) {
                    await model.findByIdAndUpdate(config._id, config, { session, runValidators: true });
                    newIds.push(config._id);
                    oldMap.delete(config._id);
                } else {
                    const [newDoc] = await model.create([config], { session });
                    newIds.push(newDoc._id);
                }
            }
            const toDelete = [...oldMap.keys()];
            if (toDelete.length) await model.deleteMany({ _id: { $in: toDelete } }, { session });
            return newIds;
        };

        const newGameIds = newData.gameConfig ? await updateArrayRule(GameRule, baseRule.tournamentStructure?.gameRules || [], newData.gameConfig, session) : baseRule.tournamentStructure?.gameRules || [];
        const newTimeIds = newData.timeManagementConfig ? await updateArrayRule(TimeManagementRule, baseRule.tournamentStructure?.timeManagementRules || [], newData.timeManagementConfig, session) : baseRule.tournamentStructure?.timeManagementRules || [];
        const newResourceIds = newData.resourceManagementConfig ? await updateArrayRule(ResourceManagementRule, baseRule.tournamentStructure?.resourceManagementRules || [], newData.resourceManagementConfig, session) : baseRule.tournamentStructure?.resourceManagementRules || [];
        const newFaultIds = newData.faultAndPenaltyConfig ? await updateArrayRule(FaultsAndPenalties, baseRule.tournamentStructure?.faultsAndPenalties || [], newData.faultAndPenaltyConfig, session) : baseRule.tournamentStructure?.faultsAndPenalties || [];

        // 6. Cập nhật StageRule (quan trọng nhất)
        let stageRuleId = baseRule.tournamentStructure?.stages?.[0];
        if (stageRuleId) {
            // Cập nhật trực tiếp stageRule
            await StageRule.findByIdAndUpdate(stageRuleId, {
                stages: newData.stages,
                sport: newData.sport,
                ruleName: newData.ruleName,
                scoringRuleId: scoringRuleId
            }, { session, runValidators: true });
        } else {
            const [newStage] = await StageRule.create([{
                tournamentId: baseRule.tournamentId,
                baseRuleId: baseRule._id,
                sport: newData.sport,
                ruleName: newData.ruleName,
                scoringRuleId: scoringRuleId,
                stages: newData.stages,
                bracketIds: []
            }], { session });
            stageRuleId = newStage._id;
        }

        // 7. Lưu lại BaseRule với cấu trúc tournamentStructure mới
        baseRule.tournamentStructure = {
            categories: newCategoryIds,
            stages: [stageRuleId],
            gameRules: newGameIds,
            scoringRules: scoringRuleId ? [scoringRuleId] : [],
            timeManagementRules: newTimeIds,
            resourceManagementRules: newResourceIds,
            faultsAndPenalties: newFaultIds
        };
        await baseRule.save({ session });

        // 8. Nếu giải đã có cấu trúc thi đấu (bracket, group, match) thì cần tái tạo lại vì stages thay đổi
        if (tournament) {
            // Xoá các dữ liệu thi đấu cũ (bracket, group, match, team placeholder)
            const allBrackets = await Bracket.find({ tournamentId: tournament._id }).distinct('_id', { session });
            if (allBrackets.length) {
                await Match.deleteMany({ bracketId: { $in: allBrackets } }, { session });
                await Group.deleteMany({ bracketId: { $in: allBrackets } }, { session });
                await Bracket.deleteMany({ _id: { $in: allBrackets } }, { session });
            }
            await Team.deleteMany({ tournamentId: tournament._id, isPlaceholder: true }, { session });

            // Tạo lại cấu trúc thi đấu mới dựa trên rule vừa cập nhật
            const sportItem = {
                sport: newData.sport,
                feeEntry: newData.feeEntry,
                maxTeams: newData.teamComposition?.maxTeams || 32,
                ruleData: newData
            };
            await initializeSportStructure(tournament._id, baseRule._id, sportItem, session);
        }

        await session.commitTransaction();
        return res.status(200).json({ success: true, message: 'Cập nhật rule thành công', data: baseRule });
    } catch (error) {
        await session.abortTransaction();
        console.error('fullUpdateRule error:', error);
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// DELETE /api/rules/:id
export const deleteRule = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        const baseRule = await BaseRule.findById(id).session(session);
        if (!baseRule) throw new Error('Bộ luật không tồn tại.');

        // Xóa các rule con liên quan
        if (baseRule.tournamentStructure?.stages) {
            await StageRule.deleteMany({ _id: { $in: baseRule.tournamentStructure.stages } }, { session });
        }
        if (baseRule.tournamentStructure?.scoringRules) {
            await ScoringRule.deleteMany({ _id: { $in: baseRule.tournamentStructure.scoringRules } }, { session });
        }
        // Tương tự có thể xóa categories, gameRules, ...
        await BaseRule.findByIdAndDelete(id, { session });

        // Xóa tham chiếu trong Tournament
        await Tournament.updateMany(
            { rules: id },
            { $pull: { rules: id } },
            { session }
        );

        await session.commitTransaction();
        return res.status(200).json({ success: true, message: 'Đã xóa bộ luật và các thành phần liên quan.' });
    } catch (error) {
        await session.abortTransaction();
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};
