// scripts/seedTemplates.js
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

async function seedSport(sportDir) {
    const categoriesPath = path.join(sportDir, 'categories.json');
    const stagesPath = path.join(sportDir, 'stage.json');
    if (!fs.existsSync(categoriesPath) || !fs.existsSync(stagesPath)) return;

    // Categories
    const categoriesData = JSON.parse(fs.readFileSync(categoriesPath, 'utf-8'));
    const sportType = categoriesData.sportType;
    const categories = categoriesData.categories;
    const categoryMap = new Map();

    for (const cat of categories) {
        let doc = await CategoryTemplate.findOne({ sportType, code: cat.code });
        if (!doc) {
            doc = new CategoryTemplate({ sportType, ...cat });
        } else {
            Object.assign(doc, cat);
            doc.sportType = sportType;
        }
        doc.status = 'actived';
        await doc.save();
        categoryMap.set(cat.code, doc._id);
    }

    // Stages
    const stagesData = JSON.parse(fs.readFileSync(stagesPath, 'utf-8'));
    const stages = stagesData.stages;
    const stageMap = new Map();

    for (const stage of stages) {
        let doc = await StageTemplate.findOne({ sportType, name: stage.name });
        if (!doc) {
            doc = new StageTemplate({ sportType, ...stage });
        } else {
            Object.assign(doc, stage);
            doc.sportType = sportType;
        }
        doc.status = 'actived';
        await doc.save();
        stageMap.set(stage.name, doc._id);
    }

    // Templates
    const files = fs.readdirSync(sportDir).filter(f => !['categories.json', 'stage.json'].includes(f) && f.endsWith('.json'));
    for (const file of files) {
        const tpl = JSON.parse(fs.readFileSync(path.join(sportDir, file), 'utf-8'));
        if (tpl.sportType !== sportType) continue;
        if (!Array.isArray(tpl.categoryCodes) || !Array.isArray(tpl.stageNames)) continue;
        const categoryIds = tpl.categoryCodes.map(code => categoryMap.get(code)).filter(id => id);
        const stageIds = tpl.stageNames.map(name => stageMap.get(name)).filter(id => id);
        let doc = await TournamentTemplate.findOne({ templateName: tpl.templateName, sportType });
        if (!doc) {
            doc = new TournamentTemplate({
                templateName: tpl.templateName,
                sportType,
                version: tpl.version,
                language: tpl.language,
                categories: categoryIds,
                stages: stageIds
            });
        } else {
            doc.version = tpl.version;
            doc.language = tpl.language;
            doc.categories = categoryIds;
            doc.stages = stageIds;
        }
        doc.status = 'actived';
        await doc.save();
        console.log(`✅ Template ${tpl.templateName} for ${sportType}`);
    }
}

async function seedAll() {
    await mongoose.connect(process.env.MONGODB_CONNECTIONSTRING);
    const sports = fs.readdirSync(CONFIG_DIR).filter(item =>
        fs.statSync(path.join(CONFIG_DIR, item)).isDirectory()
    );
    for (const sport of sports) {
        await seedSport(path.join(CONFIG_DIR, sport));
        console.log(`Seeded ${sport}`);
    }
    console.log('🎉 Seed completed');
    process.exit(0);
}

seedAll();
