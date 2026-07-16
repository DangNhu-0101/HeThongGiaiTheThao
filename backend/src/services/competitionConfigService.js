import CategoryTemplate from '../models/rules/ruleTemplate/categoryTemplate.js';
import StageTemplate from '../models/rules/ruleTemplate/stageTemplate.js';
import TournamentTemplate from '../models/rules/ruleTemplate/tournamentTemplate.js';
import TournamentItem from '../models/tournamentItem.js';

const asArray = (value) => Array.isArray(value) ? value : [];
const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const sameSport = (item, sportType) => String(item.sportType || '').toLowerCase() === String(sportType || '').toLowerCase();
const isLowerCaseOnly = (value) => String(value || '') === String(value || '').toLowerCase();
const isConfigTemplate = (template) => Boolean(String(template.slug || '').trim());
const slugifySport = (value) => String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const SPORT_DISPLAY_NAMES = {
    pickleball: 'Pickleball',
    soccer: 'Bóng đá',
    football: 'Bóng đá',
    'bong-da': 'Bóng đá',
    volleyball: 'Bóng chuyền',
    'bong-chuyen': 'Bóng chuyền',
    basketball: 'Bóng rổ',
    'bong-ro': 'Bóng rổ',
    badminton: 'Cầu lông',
    'cau-long': 'Cầu lông'
};

const canonicalSportKey = (value) => {
    const slug = slugifySport(value);
    if (['football', 'bong-da'].includes(slug)) return 'soccer';
    return slug;
};

const displaySportName = (value) => SPORT_DISPLAY_NAMES[canonicalSportKey(value)] || value;

const chooseDisplaySportName = (current, next) => {
    if (!current) return next;
    if (isLowerCaseOnly(current) && !isLowerCaseOnly(next)) return next;
    return current;
};

const sameCanonicalSport = (item, sportType) => canonicalSportKey(item.sportType) === canonicalSportKey(sportType);

const sanitizeCategory = (category) => ({
    code: category.code,
    name: category.name,
    playerSlotsPerTeam: category.playerSlotsPerTeam,
    status: category.status,
    updatedAt: category.updatedAt,
});

const sanitizeStage = (stage) => ({
    name: stage.name,
    type: stage.type,
    format: stage.format,
    scoring: stage.scoring,
    advanceCriteria: stage.advanceCriteria,
    config: stage.config || {},
    status: stage.status,
});

const sanitizeTemplate = (template, detailed = false) => {
    const item = {
        id: String(template._id),
        name: template.name || template.templateName,
        templateName: template.templateName,
        slug: template.slug,
        description: template.description || '',
        sportType: template.sportType,
        version: template.version,
        language: template.language,
        stageType: template.stageType,
        stageCount: asArray(template.stages).length || Number(template.defaultSettings?.stageCount || 1),
        hasGroups: Boolean(template.groupConfig && Object.keys(template.groupConfig).length),
        hasRoundRobin: Boolean(template.roundRobinConfig && Object.keys(template.roundRobinConfig).length) || String(template.stageType || '').includes('round_robin'),
        hasKnockout: Boolean(template.knockoutConfig && Object.keys(template.knockoutConfig).length) || String(template.stageType || '').includes('knockout'),
        hasDoubleElimination: Boolean(template.doubleEliminationConfig && Object.keys(template.doubleEliminationConfig).length) || String(template.stageType || '').includes('double'),
        status: template.status,
        isActive: template.isActive !== false && template.status === 'actived',
        updatedAt: template.updatedAt,
    };
    if (!detailed) return item;
    return {
        ...item,
        categories: asArray(template.categories).map(sanitizeCategory),
        stages: asArray(template.stages).map(sanitizeStage),
        groupConfig: template.groupConfig || {},
        roundRobinConfig: template.roundRobinConfig || {},
        knockoutConfig: template.knockoutConfig || {},
        doubleEliminationConfig: template.doubleEliminationConfig || {},
        rankingCriteria: template.rankingCriteria || [],
        advancementRules: template.advancementRules || [],
        seedingRules: template.seedingRules || {},
        defaultSettings: template.defaultSettings || {},
        templateConfig: template.templateConfig || {},
    };
};

class CompetitionConfigService {
    static async listSports({ includeInactive = false } = {}) {
        const templateQuery = includeInactive ? {} : { status: 'actived', isActive: { $ne: false } };
        const categoryQuery = includeInactive ? {} : { status: 'actived' };
        const [templates, categories, stages, tournamentUsage] = await Promise.all([
            TournamentTemplate.find(templateQuery).populate('categories').populate('stages').lean(),
            CategoryTemplate.find(categoryQuery).lean(),
            StageTemplate.find(categoryQuery).lean(),
            TournamentItem.aggregate([
                { $match: { status: { $ne: 'cancelled' } } },
                {
                    $project: {
                        sportType: {
                            $ifNull: [
                                '$sportType',
                                '$competitionFormat.sportType'
                            ]
                        }
                    }
                },
                { $match: { sportType: { $nin: [null, ''] } } },
                { $group: { _id: '$sportType', count: { $sum: 1 } } }
            ]),
        ]);

        const tournamentCountBySport = tournamentUsage.reduce((map, item) => {
            const key = canonicalSportKey(item._id);
            map.set(key, (map.get(key) || 0) + Number(item.count || 0));
            return map;
        }, new Map());

        const sportNames = [
            ...templates.map((item) => item.sportType),
            ...categories.map((item) => item.sportType),
            ...stages.map((item) => item.sportType),
        ].filter(Boolean).reduce((map, sportType) => {
            const key = canonicalSportKey(sportType);
            map.set(key, chooseDisplaySportName(map.get(key), sportType));
            return map;
        }, new Map());

        return Array.from(sportNames.values()).sort((a, b) => a.localeCompare(b, 'vi')).map((sportType) => {
            const sportTemplates = templates.filter((item) => sameCanonicalSport(item, sportType) && isConfigTemplate(item));
            const sportCategories = categories.filter((item) => sameCanonicalSport(item, sportType));
            const sportStages = stages.filter((item) => sameCanonicalSport(item, sportType));
            const sportKey = canonicalSportKey(sportType);
            const active = sportTemplates.some((item) => item.status === 'actived' && item.isActive !== false)
                || sportCategories.some((item) => item.status === 'actived');
            return {
                name: displaySportName(sportType),
                displayName: displaySportName(sportType),
                englishName: sportTemplates[0]?.defaultSettings?.englishName || '',
                slug: sportTemplates[0]?.defaultSettings?.sportSlug || sportKey,
                status: active ? 'actived' : 'inactived',
                imageUrl: sportTemplates[0]?.defaultSettings?.imageUrl || '',
                categories: sportCategories.map(sanitizeCategory),
                stages: sportStages.map(sanitizeStage),
                templates: sportTemplates.map((template) => sanitizeTemplate(template)),
                tournamentsCount: tournamentCountBySport.get(sportKey) || 0,
                formatsCount: sportTemplates.length,
                rulesCount: sportCategories.length,
                updatedAt: sportTemplates[0]?.updatedAt || sportCategories[0]?.updatedAt || sportStages[0]?.updatedAt || null,
            };
        });
    }

    static async listTemplatesBySport(sportType) {
        if (!sportType) {
            const error = new Error('Vui lòng chọn môn thi đấu.');
            error.statusCode = 400;
            throw error;
        }
        const sportPattern = new RegExp(`^${escapeRegex(sportType)}$`, 'i');
        const templates = await TournamentTemplate.find({ sportType: sportPattern, status: 'actived', isActive: { $ne: false }, slug: { $exists: true, $ne: '' } })
            .populate('categories')
            .populate('stages')
            .lean();
        return templates.map((template) => sanitizeTemplate(template, true));
    }

    static async getTemplateDetail(templateId) {
        const template = await TournamentTemplate.findOne({ _id: templateId, status: 'actived', isActive: { $ne: false }, slug: { $exists: true, $ne: '' } })
            .populate('categories')
            .populate('stages')
            .lean();
        if (!template) {
            const error = new Error('Không tìm thấy thể thức mẫu hoặc thể thức đã bị tắt.');
            error.statusCode = 404;
            throw error;
        }
        return sanitizeTemplate(template, true);
    }

    static async setSportStatus(sportType, active) {
        const status = active ? 'actived' : 'inactived';
        const sportPattern = new RegExp(`^${escapeRegex(sportType)}$`, 'i');
        const [templatesResult, categoriesResult, stagesResult] = await Promise.all([
            TournamentTemplate.updateMany({ sportType: sportPattern }, { $set: { status, isActive: active } }),
            CategoryTemplate.updateMany({ sportType: sportPattern }, { $set: { status } }),
            StageTemplate.updateMany({ sportType: sportPattern }, { $set: { status } }),
        ]);
        return {
            sportType,
            status,
            modified: {
                templates: templatesResult.modifiedCount || 0,
                categories: categoriesResult.modifiedCount || 0,
                stages: stagesResult.modifiedCount || 0,
            },
        };
    }
}

export default CompetitionConfigService;
