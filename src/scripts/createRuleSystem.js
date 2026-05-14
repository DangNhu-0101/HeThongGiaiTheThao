import mongoose from "mongoose";
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import RuleSystem from "../models/rules/ruleSystem.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../src/data');

const loadRuleSystems = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_CONNECTIONSTRING);
        console.log("🚀 Kết nối DB thành công");

        const files = fs.readdirSync(DATA_DIR).filter(file => file.endsWith('.json'));

        console.log(`📂 Tìm thấy ${files.length} file cấu hình.`);

        for (const file of files) {
            const filePath = path.join(DATA_DIR, file);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

            const isExisted = await RuleSystem.exists({ ruleName: data.templateName });

            if (isExisted) {
                console.log(`⏩ Bỏ qua (đã tồn tại): ${file}`);
                continue; // Nhảy sang file tiếp theo
            }

            // Mapping dữ liệu chuẩn hóa
            const formattedRule = {
                ruleName: data.templateName,
                sport: mapSportName(data.sportType), // Trả về 'Pickleball'
                version: data.version,
                language: data.language,

                // Copy trực tiếp các cụm object từ JSON
                tournamentStructure: data.tournamentStructure,
                gameRules: data.gameRules,
                scoringConfigurations: data.scoringConfigurations,
                timeManagement: data.timeManagement,
                resourceManagement: data.resourceManagement,
                faultsAndPenalties: data.faultsAndPenalties
            };

            await RuleSystem.deleteOne({ ruleName: formattedRule.ruleName }); // Xóa nếu đã tồn tại để tránh trùng lặp

            await RuleSystem.create(formattedRule);
            console.log(`✅ Đã nạp thành công: ${file}`);
        }
    }
    catch (error) {
        console.log('error mongoseDB connect', error)
        process.exit(1);
    }
};
loadRuleSystems();

export default loadRuleSystems;

const mapSportName = (input) => {
    const mapping = {
        'football': 'Football',
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