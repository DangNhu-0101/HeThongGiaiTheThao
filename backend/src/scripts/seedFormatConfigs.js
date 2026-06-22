import dotenv from 'dotenv';
import fs from 'fs';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

import CategoryTemplate from '../models/rules/ruleTemplate/categoryTemplate.js';
import StageTemplate from '../models/rules/ruleTemplate/stageTemplate.js';
import TournamentTemplate from '../models/rules/ruleTemplate/tournamentTemplate.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_CONFIG_DIR = path.resolve(__dirname, '../../../../JSON');
const CONFIG_DIR = process.env.FORMAT_CONFIG_DIR
  ? path.resolve(process.env.FORMAT_CONFIG_DIR)
  : DEFAULT_CONFIG_DIR;

const files = {
  groupStage: 'groupStageConfig.json',
  knockout: 'matchKnockOutConfig.json',
  sportRule: 'sportRuleConfig.json',
};

const readJson = (fileName) => {
  const filePath = path.join(CONFIG_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing config file: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

const normalizeStageType = (configType) => {
  if (configType === 'knockout') return 'KNOCKOUT';
  return 'GROUP_STAGE';
};

const upsertStageTemplate = async (config) => {
  const type = normalizeStageType(config.configType);
  const format = config.defaultValues?.groupStage?.format || config.defaultValues?.knockout?.bracketFormat || config.configType;
  const doc = await StageTemplate.findOneAndUpdate(
    { sportType: config.sportType, type, name: config.label },
    {
      name: config.label,
      sportType: config.sportType,
      type,
      format,
      config: {
        sourceId: config._id,
        configType: config.configType,
        version: config.version,
        fields: config.fields,
        defaultValues: config.defaultValues,
      },
      status: 'active',
    },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
  );
  return doc;
};

const upsertCategoryTemplate = async (config) => {
  const playersPerTeam = Number(config.defaultValues?.sportRule?.playersPerTeam || 1);
  const doc = await CategoryTemplate.findOneAndUpdate(
    { sportType: config.sportType, code: 'DEFAULT_RULE' },
    {
      code: 'DEFAULT_RULE',
      name: `${config.sportType} default rule`,
      sportType: config.sportType,
      playerSlotsPerTeam: { min: playersPerTeam, max: playersPerTeam },
      gameRules: {
        name: config.label,
        description: config.label,
        playersPerTeam,
        substitutions: { type: config.defaultValues?.sportRule?.substitutionType || 'NONE' },
        hasVAR: Boolean(config.defaultValues?.sportRule?.hasVAR),
        customRules: {
          sourceId: config._id,
          fields: config.fields,
          sportRule: config.defaultValues?.sportRule || {},
        },
      },
      scoringRules: {
        name: `${config.sportType} scoring`,
        pointSystem: {
          win: config.defaultValues?.scoring?.winPoints ?? 1,
          draw: config.defaultValues?.scoring?.drawPoints ?? 0,
          loss: config.defaultValues?.scoring?.lossPoints ?? 0,
        },
        walkover: config.defaultValues?.scoring?.walkover || {},
        setsCalculation: {
          isSupported: Boolean(config.defaultValues?.scoring?.setsCalculation),
          ...(config.defaultValues?.scoring?.setsCalculation || {}),
        },
      },
      timeManagementRules: {
        name: `${config.sportType} time management`,
        customTimeRules: config.defaultValues?.timeManagement || {},
      },
      status: 'active',
    },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
  );
  return doc;
};

const upsertTournamentTemplates = async (categoryBySport, stagesBySport) => {
  for (const [sportType, category] of categoryBySport.entries()) {
    const stages = stagesBySport.get(sportType) || [];
    if (stages.length === 0) continue;
    await TournamentTemplate.findOneAndUpdate(
      { templateName: `${sportType} default format` },
      {
        templateName: `${sportType} default format`,
        sportType,
        version: '1.0',
        language: 'vi',
        categories: [category._id],
        stages: stages.map((stage) => stage._id),
        status: 'active',
      },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
    );
  }
};

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_CONNECTIONSTRING);
  const groupConfigs = readJson(files.groupStage);
  const knockoutConfigs = readJson(files.knockout);
  const sportRuleConfigs = readJson(files.sportRule);

  const stagesBySport = new Map();
  for (const config of [...groupConfigs, ...knockoutConfigs]) {
    const stage = await upsertStageTemplate(config);
    const list = stagesBySport.get(config.sportType) || [];
    list.push(stage);
    stagesBySport.set(config.sportType, list);
    console.log(`Seeded stage config: ${config.label}`);
  }

  const categoryBySport = new Map();
  for (const config of sportRuleConfigs) {
    const category = await upsertCategoryTemplate(config);
    categoryBySport.set(config.sportType, category);
    console.log(`Seeded sport rule config: ${config.label}`);
  }

  await upsertTournamentTemplates(categoryBySport, stagesBySport);
  console.log('Seeded format configs successfully.');
  await mongoose.disconnect();
};

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
