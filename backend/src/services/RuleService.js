import CategoryTemplate from '../models/rules/ruleTemplate/categoryTemplate.js';
import StageTemplate from '../models/rules/ruleTemplate/stageTemplate.js';
import TournamentTemplate from '../models/rules/ruleTemplate/tournamentTemplate.js';

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const sportQuery = (sportType) => new RegExp(`^${escapeRegex(sportType)}$`, 'i');

class RuleService {

    static async getAllTemplates(filter = {}) {
        let query = { status: 'actived' };
        if (filter.sportType) query.sportType = sportQuery(filter.sportType);
        const templates = await TournamentTemplate.find(query)
            .populate('categories')
            .populate('stages')
            .lean();
        return templates;
    }

    static async getTemplateById(templateId) {
        const template = await TournamentTemplate.findById(templateId)
            .populate('categories')
            .populate('stages')
            .lean();
        if (!template) throw new Error('Template not found');
        return template;
    }

    static async getCategoriesBySport(sportType) {
        const categories = await CategoryTemplate.find({ sportType: sportQuery(sportType), status: 'actived' }).lean();
        return categories;
    }

    static async getCategoryById(categoryId) {
        const category = await CategoryTemplate.findById(categoryId).lean();
        if (!category) throw new Error('Category not found');
        return category;
    }

    static async getFlattenRulesForCategory(categoryId) {
        const category = await this.getCategoryById(categoryId);
        // Chỉ lấy các trường rule cần thiết (không lấy toàn bộ rest)
        const { _id, sportType, code, name, playerSlotsPerTeam, gameRules, scoringRules, timeManagementRules, resourceManagementRules, faultsAndPenaltiesRules } = category;
        return {
            categoryId: _id,
            sportType,
            code,
            name,
            playerSlotsPerTeam,
            gameRules: gameRules || {},
            scoringRules: scoringRules || {},
            timeManagementRules: timeManagementRules || {},
            resourceManagementRules: resourceManagementRules || {},
            faultsAndPenaltiesRules: faultsAndPenaltiesRules || {}
        };
    }

    static async getStagesBySport(sportType) {
        const stages = await StageTemplate.find({ sportType: sportQuery(sportType), status: 'actived' }).lean();
        return stages;
    }
}

export default RuleService;
