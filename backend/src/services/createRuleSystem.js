import mongoose from "mongoose";
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import BaseRule from "../models/Rule/baseRules.js";
import StageRule from "../models/Rule/stageRules.js";
import ScoringRule from "../models/Rule/scoringRules.js";
import GameRule from "../models/Rule/gameRules.js";
import CategoryRule from "../models/Rule/categoryRules.js";
import TimeManagementRule from "../models/Rule/timeManagementRules.js";
import ResourceManagementRule from "../models/Rule/resourceManagementRules.js";
import FaultsAndPenalties from "../models/Rule/faultsAndPenalties.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../database/sports');

const mapSportName = (input) => {
    const mapping = {
        'football': 'Soccer',
        'basketball': 'Basketball',
        'volleyball': 'Volleyball',
        'tennis': 'Tennis',
        'table_tennis': 'Table Tennis',
        'badminton': 'Badminton',
        'pickleball': 'Pickleball',
        'other': 'Other'
    };
    return mapping[input] || input;
};

const loadRuleSystems = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_CONNECTIONSTRING);
        console.log("🚀 Kết nối DB thành công");

        const files = fs.readdirSync(DATA_DIR).filter(file => file.endsWith('.json'));
        console.log(`📂 Tìm thấy ${files.length} file cấu hình.`);

        for (const file of files) {
            const filePath = path.join(DATA_DIR, file);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

            // Kiểm tra xem BaseRule với ruleName này đã tồn tại chưa
            const existed = await BaseRule.findOne({ ruleName: data.templateName });
            if (existed) {
                console.log(`⏩ Bỏ qua (đã tồn tại): ${file}`);
                continue;
            }

            const sport = mapSportName(data.sportType);
            if (!sport) {
                console.warn(`⚠️ Không xác định được sport cho file ${file}, bỏ qua`);
                continue;
            }

            // 1. Tạo ScoringRule (nếu có)
            let scoringRuleId = null;
            if (data.scoringConfigurations) {
                const scoring = await ScoringRule.create({
                    sport,
                    ruleName: `${data.templateName}_scoring`,
                    standardSideOut: data.scoringConfigurations.standardSideOut,
                    rallyScoring: data.scoringConfigurations.rallyScoring,
                    description: `Scoring config for ${data.templateName}`
                });
                scoringRuleId = scoring._id;
            }

            // 2. Tạo CategoryRule (nếu có)
            let categoryIds = [];
            if (data.tournamentStructure && data.tournamentStructure.categories) {
                const categoryDoc = await CategoryRule.create({
                    sport,
                    ruleName: `${data.templateName}_categories`,
                    categories: data.tournamentStructure.categories,
                    skillLevels: data.tournamentStructure.skillLevels || []
                });
                categoryIds = [categoryDoc._id];
            }

            // 3. Tạo GameRule (Mixed)
            let gameIds = [];
            if (data.gameRules) {
                const gameDoc = await GameRule.create({
                    sport,
                    ruleName: `${data.templateName}_game`,
                    rules: data.gameRules,
                    description: `Game rules for ${data.templateName}`
                });
                gameIds = [gameDoc._id];
            }

            // 4. Tạo TimeManagementRule
            let timeIds = [];
            if (data.timeManagement) {
                const timeDoc = await TimeManagementRule.create({
                    sport,
                    ruleName: `${data.templateName}_time`,
                    warmUpMinutes: data.timeManagement.warmUpMinutes,
                    standardTimeOutsPerSet: data.timeManagement.standardTimeOutsPerSet,
                    timeOutDurationSeconds: data.timeManagement.timeOutDurationSeconds,
                    medicalTimeOutMinutes: data.timeManagement.medicalTimeOutMinutes,
                    betweenSetRestMinutes: data.timeManagement.betweenSetRestMinutes,
                    maxWaitTimeBeforeForfeit: data.timeManagement.maxWaitTimeBeforeForfeit
                });
                timeIds = [timeDoc._id];
            }

            // 5. Tạo ResourceManagementRule
            let resourceIds = [];
            if (data.resourceManagement) {
                const resourceDoc = await ResourceManagementRule.create({
                    sport,
                    ruleName: `${data.templateName}_resource`,
                    courts: data.resourceManagement.courts,
                    personnelPerMatch: data.resourceManagement.personnelPerMatch,
                    equipment: data.resourceManagement.equipment
                });
                resourceIds = [resourceDoc._id];
            }

            // 6. Tạo FaultsAndPenalties
            let faultIds = [];
            if (data.faultsAndPenalties) {
                const faultDoc = await FaultsAndPenalties.create({
                    sport,
                    ruleName: `${data.templateName}_fault`,
                    technicalFaults: data.faultsAndPenalties.technicalFaults,
                    conductPenalties: data.faultsAndPenalties.conductPenalties
                });
                faultIds = [faultDoc._id];
            }

            // 7. Tạo StageRule (dựa trên tournamentStructure.stages)
            let stageIds = [];
            if (data.tournamentStructure && data.tournamentStructure.stages) {
                const stageDoc = await StageRule.create({
                    sport,
                    ruleName: `${data.templateName}_stage`,
                    stages: data.tournamentStructure.stages,
                    scoringRuleId: scoringRuleId
                });
                stageIds = [stageDoc._id];
            }

            // 8. Tạo BaseRule tổng hợp
            const baseRuleData = {
                ruleName: data.templateName,
                sport,
                version: data.version || "1.0",
                language: data.language || "vi",
                description: `Auto seeded rule for ${sport}`,
                tournamentStructure: {
                    categories: categoryIds,
                    stages: stageIds,
                    gameRules: gameIds,
                    scoringRules: scoringRuleId ? [scoringRuleId] : [],
                    timeManagementRules: timeIds,
                    resourceManagementRules: resourceIds,
                    faultsAndPenalties: faultIds
                }
            };
            await BaseRule.create(baseRuleData);
            console.log(`✅ Đã nạp thành công: ${file}`);
        }
        console.log("🎉 Hoàn tất seed rule systems!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Lỗi khi seed:", error);
        process.exit(1);
    }
};

loadRuleSystems();