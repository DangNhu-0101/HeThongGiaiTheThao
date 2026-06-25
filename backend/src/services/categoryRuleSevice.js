// services/categoryRuleService.js
import CategoryRule from '../models/rules/categories.js';
import CategoryTemplate from '../models/rules/ruleTemplate/categoryTemplate.js';
import GameRule from '../models/rules/gameRules.js';
import ScoringRule from '../models/rules/scoringRules.js';
import TimeManagementRule from '../models/rules/timeManagements.js';
import ResourceManagementRule from '../models/rules/resourceManagements.js';
import FaultsAndPenalties from '../models/rules/faultsAndPenalties.js';
import mongoose from 'mongoose';

class CategoryRuleService {

    // === TẠO MỚI TỪ TEMPLATE ===
    static async createFromTemplate(categoryTemplateId, editedRules, sportType, tournamentItemId = null, session = null) {
        // 1. Lấy template gốc
        const template = await CategoryTemplate.findById(categoryTemplateId);
        if (!template) throw new Error('CategoryTemplate not found');

        // 2. Xác định dữ liệu cuối cùng
        const finalGameRules = editedRules?.gameRules || template.gameRules;
        const finalScoringRules = editedRules?.scoringRules || template.scoringRules;
        const finalTimeManagementRules = editedRules?.timeManagementRules || template.timeManagementRules;
        const finalResourceManagementRules = editedRules?.resourceManagementRules || template.resourceManagementRules;
        const finalFaultsAndPenaltiesRules = editedRules?.faultsAndPenaltiesRules || template.faultsAndPenaltiesRules;

        // 3. Tạo các document rule chi tiết
        const createRule = async (Model, data) => {
            if (!data || Object.keys(data).length === 0) return null;
            const rule = new Model({ ...data, sportType, status: 'actived' });
            if (session) await rule.save({ session });
            else await rule.save();
            return rule._id;
        };

        const [gameRuleId, scoringRuleId, timeRuleId, resourceRuleId, faultsRuleId] = await Promise.all([
            createRule(GameRule, finalGameRules),
            createRule(ScoringRule, finalScoringRules),
            createRule(TimeManagementRule, finalTimeManagementRules),
            createRule(ResourceManagementRule, finalResourceManagementRules),
            createRule(FaultsAndPenalties, finalFaultsAndPenaltiesRules)
        ]);

        // 4. Tạo CategoryRule
        const categoryRule = new CategoryRule({
            tournamentItemId: tournamentItemId,
            name: template.name,
            sportType: template.sportType,
            displayName: template.name,
            playerSlotsPerTeam: template.playerSlotsPerTeam,
            gameRule: gameRuleId,
            scoringRule: scoringRuleId,
            timeManagementRule: timeRuleId,
            resourceManagementRule: resourceRuleId,
            faultsAndPenaltiesRule: faultsRuleId,
            status: 'actived'
        });
        if (session) await categoryRule.save({ session });
        else await categoryRule.save();

        return categoryRule;
    }

    // === LẤY THEO ID ===
    static async getById(id) {
        const categoryRule = await CategoryRule.findById(id)
            .populate('gameRule')
            .populate('scoringRule')
            .populate('timeManagementRule')
            .populate('resourceManagementRule')
            .populate('faultsAndPenaltiesRule')
            .lean();
        if (!categoryRule) throw new Error('CategoryRule not found');
        return categoryRule;
    }

    // === CẬP NHẬT ===
    static async update(id, updateData, session = null) {
        const categoryRule = await CategoryRule.findById(id).session(session);
        if (!categoryRule) throw new Error('CategoryRule not found');

        if (updateData.name) categoryRule.name = updateData.name;
        if (updateData.displayName) categoryRule.displayName = updateData.displayName;
        if (updateData.playerSlotsPerTeam) categoryRule.playerSlotsPerTeam = updateData.playerSlotsPerTeam;
        if (updateData.status) categoryRule.status = updateData.status;
        if (updateData.gameRule) categoryRule.gameRule = updateData.gameRule;
        if (updateData.scoringRule) categoryRule.scoringRule = updateData.scoringRule;
        if (updateData.timeManagementRule) categoryRule.timeManagementRule = updateData.timeManagementRule;
        if (updateData.resourceManagementRule) categoryRule.resourceManagementRule = updateData.resourceManagementRule;
        if (updateData.faultsAndPenaltiesRule) categoryRule.faultsAndPenaltiesRule = updateData.faultsAndPenaltiesRule;

        if (session) await categoryRule.save({ session });
        else await categoryRule.save();
        return categoryRule;
    }

    // === XÓA (đánh dấu cancelled và cập nhật rule con) ===
    static async delete(id, session = null) {
        const categoryRule = await CategoryRule.findById(id).session(session);
        if (!categoryRule) throw new Error('CategoryRule not found');

        // Cập nhật status của các rule con
        const updateStatus = async (Model, ruleId) => {
            if (ruleId) {
                const rule = await Model.findById(ruleId).session(session);
                if (rule) {
                    rule.status = 'inactived';
                    await rule.save({ session });
                }
            }
        };
        await Promise.all([
            updateStatus(GameRule, categoryRule.gameRule),
            updateStatus(ScoringRule, categoryRule.scoringRule),
            updateStatus(TimeManagementRule, categoryRule.timeManagementRule),
            updateStatus(ResourceManagementRule, categoryRule.resourceManagementRule),
            updateStatus(FaultsAndPenalties, categoryRule.faultsAndPenaltiesRule)
        ]);

        categoryRule.status = 'cancelled';
        if (session) await categoryRule.save({ session });
        else await categoryRule.save();
        return categoryRule;
    }

    // === LẤY DANH SÁCH ===
    static async getAll(filter = {}) {
        const query = { status: { $ne: 'cancelled' } };
        if (filter.sportType) query.sportType = filter.sportType;
        return await CategoryRule.find(query)
            .populate('gameRule')
            .populate('scoringRule')
            .populate('timeManagementRule')
            .populate('resourceManagementRule')
            .populate('faultsAndPenaltiesRule')
            .lean();
    }

    // === CẬP NHẬT TOURNAMENT ITEM ID ===
    static async updateTournamentItemId(categoryRuleId, tournamentItemId, session = null) {
        const categoryRule = await CategoryRule.findById(categoryRuleId).session(session);
        if (!categoryRule) throw new Error('CategoryRule not found');
        categoryRule.tournamentItemId = tournamentItemId;
        if (session) await categoryRule.save({ session });
        else await categoryRule.save();
        return categoryRule;
    }
}

export default CategoryRuleService;