// services/categoryRuleService.js
import CategoryRule from '../models/rules/categories.js';
import CategoryTemplate from '../models/rules/ruleTemplate/categoryTemplate.js';
import GameRule from '../models/rules/gameRule.js';
import ScoringRule from '../models/rules/scoringRule.js';
import TimeManagementRule from '../models/rules/timeManagementRule.js';
import ResourceManagementRule from '../models/rules/resourceManagementRule.js';
import FaultsAndPenalties from '../models/rules/faultsAndPenalties.js';
import mongoose from 'mongoose';

class CategoryRuleService {

    static async createFromTemplate(categoryTemplateId, editedRules, sportType, session = null) {
        // 1. Lấy template gốc
        const template = await CategoryTemplate.findById(categoryTemplateId);
        if (!template) throw new Error('CategoryTemplate not found');

        // 2. Xác định dữ liệu cuối cùng cho từng loại rule
        const finalGameRules = editedRules?.gameRules || template.gameRules;
        const finalScoringRules = editedRules?.scoringRules || template.scoringRules;
        const finalTimeManagementRules = editedRules?.timeManagementRules || template.timeManagementRules;
        const finalResourceManagementRules = editedRules?.resourceManagementRules || template.resourceManagementRules;
        const finalFaultsAndPenaltiesRules = editedRules?.faultsAndPenaltiesRules || template.faultsAndPenaltiesRules;

        // 3. Tạo các document rule chi tiết
        const createRule = async (Model, data) => {
            if (!data || Object.keys(data).length === 0) return null;
            const rule = new Model({ ...data, sportType, status: 'active' });
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
            tournamentItemId: null, // sẽ cập nhật sau khi tạo TournamentItem
            name: template.name,
            sportType: template.sportType,
            displayName: template.name,
            playerSlotsPerTeam: template.playerSlotsPerTeam,
            gameRule: gameRuleId,
            scoringRule: scoringRuleId,
            timeManagementRule: timeRuleId,
            resourceManagementRule: resourceRuleId,
            faultsAndPenaltiesRule: faultsRuleId,
            status: 'active'
        });
        if (session) await categoryRule.save({ session });
        else await categoryRule.save();

        return categoryRule;
    }

    // Phương thức lấy CategoryRule theo ID (có populate)
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

    static async update(id, updateData, session = null) {
        const categoryRule = await CategoryRule.findById(id).session(session);
        if (!categoryRule) throw new Error('CategoryRule not found');
        // Cập nhật các trường cơ bản (nếu có)
        if (updateData.name) categoryRule.name = updateData.name;
        if (updateData.displayName) categoryRule.displayName = updateData.displayName;
        if (updateData.playerSlotsPerTeam) categoryRule.playerSlotsPerTeam = updateData.playerSlotsPerTeam;
        if (updateData.status) categoryRule.status = updateData.status;
        // Cập nhật các rule tham chiếu (có thể tạo mới hoặc cập nhật rule cũ)
        // Ở đây ta giả sử FE gửi các ruleId mới hoặc object rule mới
        // Để đơn giản, ta chỉ cho phép cập nhật trực tiếp các ruleId (nếu có)
        if (updateData.gameRule) categoryRule.gameRule = updateData.gameRule;
        if (updateData.scoringRule) categoryRule.scoringRule = updateData.scoringRule;
        if (updateData.timeManagementRule) categoryRule.timeManagementRule = updateData.timeManagementRule;
        if (updateData.resourceManagementRule) categoryRule.resourceManagementRule = updateData.resourceManagementRule;
        if (updateData.faultsAndPenaltiesRule) categoryRule.faultsAndPenaltiesRule = updateData.faultsAndPenaltiesRule;
        if (session) await categoryRule.save({ session });
        else await categoryRule.save();
        return categoryRule;
    }

    static async delete(id, session = null) {
        const categoryRule = await CategoryRule.findById(id).session(session);
        if (!categoryRule) throw new Error('CategoryRule not found');
        categoryRule.status = 'cancelled';
        if (session) await categoryRule.save({ session });
        else await categoryRule.save();
        return categoryRule;
    }

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
}

export default CategoryRuleService;