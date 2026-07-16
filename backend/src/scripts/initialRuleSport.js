import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import CategoryTemplate from '../models/rules/ruleTemplate/categoryTemplate.js';
import StageTemplate from '../models/rules/ruleTemplate/stageTemplate.js';
import TournamentTemplate from '../models/rules/ruleTemplate/tournamentTemplate.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_DIR = path.resolve(__dirname, '../config');

const emptyStats = () => ({
    sports: 0,
    categories: { created: 0, updated: 0, skipped: 0, errors: 0 },
    stages: { created: 0, updated: 0, skipped: 0, errors: 0 },
    templates: { created: 0, updated: 0, skipped: 0, errors: 0 },
});

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf-8'));

const logResult = (kind, action, key) => {
    console.log(`[${kind}] ${action}: ${key}`);
};

async function upsertCategory(sportType, category, stats, categoryMap) {
    try {
        if (!category.code) {
            stats.categories.skipped += 1;
            logResult('category', 'skipped', `${sportType} thiếu code`);
            return;
        }
        const existing = await CategoryTemplate.findOne({ sportType, code: category.code });
        const doc = existing || new CategoryTemplate({ sportType, code: category.code });
        Object.assign(doc, category);
        doc.sportType = sportType;
        doc.status = category.status || 'actived';
        await doc.save();
        categoryMap.set(category.code, doc._id);
        stats.categories[existing ? 'updated' : 'created'] += 1;
        logResult('category', existing ? 'updated' : 'created', `${sportType}/${category.code}`);
    } catch (error) {
        stats.categories.errors += 1;
        console.error(`[category] error ${sportType}/${category.code || 'unknown'}:`, error.message);
    }
}

async function upsertStage(sportType, stage, stats, stageMap) {
    try {
        if (!stage.name) {
            stats.stages.skipped += 1;
            logResult('stage', 'skipped', `${sportType} thiếu name`);
            return;
        }
        const existing = await StageTemplate.findOne({ sportType, name: stage.name });
        const doc = existing || new StageTemplate({ sportType, name: stage.name });
        Object.assign(doc, stage);
        doc.sportType = sportType;
        doc.status = stage.status || 'actived';
        await doc.save();
        stageMap.set(stage.name, doc._id);
        stats.stages[existing ? 'updated' : 'created'] += 1;
        logResult('stage', existing ? 'updated' : 'created', `${sportType}/${stage.name}`);
    } catch (error) {
        stats.stages.errors += 1;
        console.error(`[stage] error ${sportType}/${stage.name || 'unknown'}:`, error.message);
    }
}

async function upsertTemplate(sportType, template, stats, categoryMap, stageMap) {
    try {
        if (template.sportType !== sportType) {
            stats.templates.skipped += 1;
            logResult('template', 'skipped', `${template.templateName || 'unknown'} khác sportType ${sportType}`);
            return;
        }
        if (!template.templateName || !Array.isArray(template.categoryCodes) || !Array.isArray(template.stageNames)) {
            stats.templates.skipped += 1;
            logResult('template', 'skipped', `${sportType} thiếu templateName/categoryCodes/stageNames`);
            return;
        }

        const categoryIds = template.categoryCodes.map((code) => categoryMap.get(code)).filter(Boolean);
        const stageIds = template.stageNames.map((name) => stageMap.get(name)).filter(Boolean);
        const existing = await TournamentTemplate.findOne({ templateName: template.templateName, sportType });
        const doc = existing || new TournamentTemplate({ templateName: template.templateName, sportType });

        doc.version = template.version || '1.0';
        doc.language = template.language || 'vi';
        doc.categories = categoryIds;
        doc.stages = stageIds;
        doc.name = template.name || template.templateName;
        doc.slug = template.slug || '';
        doc.description = template.description || '';
        doc.stageType = template.stageType || '';
        doc.groupConfig = template.groupConfig || {};
        doc.roundRobinConfig = template.roundRobinConfig || {};
        doc.knockoutConfig = template.knockoutConfig || {};
        doc.doubleEliminationConfig = template.doubleEliminationConfig || {};
        doc.rankingCriteria = template.rankingCriteria || [];
        doc.advancementRules = template.advancementRules || [];
        doc.seedingRules = template.seedingRules || {};
        doc.defaultSettings = template.defaultSettings || {};
        doc.templateConfig = template.templateConfig || {};
        doc.isActive = template.isActive !== false;
        doc.status = template.status || 'actived';
        await doc.save();

        stats.templates[existing ? 'updated' : 'created'] += 1;
        logResult('template', existing ? 'updated' : 'created', `${sportType}/${template.templateName}`);
    } catch (error) {
        stats.templates.errors += 1;
        console.error(`[template] error ${sportType}/${template.templateName || 'unknown'}:`, error.message);
    }
}

async function seedSport(sportDir, stats) {
    const categoriesPath = path.join(sportDir, 'categories.json');
    const stagesPath = path.join(sportDir, 'stage.json');
    if (!fs.existsSync(categoriesPath) || !fs.existsSync(stagesPath)) return;

    const categoriesData = readJson(categoriesPath);
    const stagesData = readJson(stagesPath);
    const sportType = categoriesData.sportType;
    if (!sportType || stagesData.sportType !== sportType) {
        throw new Error(`Config sportType không khớp trong ${sportDir}`);
    }

    stats.sports += 1;
    console.log(`\n=== Import ${sportType} ===`);
    const categoryMap = new Map();
    const stageMap = new Map();

    for (const category of categoriesData.categories || []) {
        await upsertCategory(sportType, category, stats, categoryMap);
    }
    for (const stage of stagesData.stages || []) {
        await upsertStage(sportType, stage, stats, stageMap);
    }

    const files = fs.readdirSync(sportDir).filter((file) => !['categories.json', 'stage.json'].includes(file) && file.endsWith('.json'));
    for (const file of files) {
        const payload = readJson(path.join(sportDir, file));
        const templates = Array.isArray(payload.templates) ? payload.templates : [payload];
        for (const template of templates) {
            await upsertTemplate(sportType, template, stats, categoryMap, stageMap);
        }
    }
}

async function seedAll() {
    const connectionString = process.env.MONGODB_CONNECTIONSTRING || process.env.MONGO_URI;
    if (!connectionString) throw new Error('Thiếu biến môi trường MONGODB_CONNECTIONSTRING');

    const stats = emptyStats();
    await mongoose.connect(connectionString);
    const sports = fs.readdirSync(CONFIG_DIR).filter((item) => fs.statSync(path.join(CONFIG_DIR, item)).isDirectory());
    for (const sport of sports) {
        await seedSport(path.join(CONFIG_DIR, sport), stats);
    }
    await mongoose.disconnect();

    console.log('\n=== Tổng kết import competition config ===');
    console.table({
        sports: { processed: stats.sports },
        categories: stats.categories,
        stages: stats.stages,
        templates: stats.templates,
    });

    if (stats.categories.errors || stats.stages.errors || stats.templates.errors) process.exit(1);
}

seedAll().catch(async (error) => {
    console.error('Import competition config thất bại:', error.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
});
