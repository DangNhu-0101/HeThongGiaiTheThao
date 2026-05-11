import mongoose from "mongoose";
import BaseRule from "./baseRules.js"; 

const footballRuleSchema = new mongoose.Schema({
    footballConfig: {
        // 1. THỂ THỨC SÂN (Linh hoạt cho phủi và chuyên nghiệp)
        pitchFormat: {
            type: String,
            enum: ['5v5', '7v7', '11v11'],
            required: true
        },

        // 2. CẤU TRÚC TRẬN ĐẤU
        matchStructure: {
            halfDuration: { type: Number, required: true }, // Số phút mỗi hiệp
            breakTime: { type: Number, default: 15 },       // Nghỉ giữa hiệp
            hasExtraTime: { type: Boolean, default: false }, // Có hiệp phụ không
            extraTimeDuration: { type: Number, default: 0 }  // Phút mỗi hiệp phụ
        },

        // 3. THAY NGƯỜI (Substitutions)
        substituteConfig: {
            allowSubstitutes: { type: Boolean, default: true },
            maxSubsPerMatch: { type: Number, default: 5 },    // Tổng số lượt thay
            limitSubsTimes: { type: Number, default: 3 }      // Số lần dừng trận để thay
        },

        // 4. LUẬT ĐẶC THÙ
        specialRules: {
            hasOffside: { type: Boolean, default: true },     // Có bắt việt vị không
            yellowCardFine: { type: Number, default: 0 },
            redCardFine: { type: Number, default: 0 },
            accumulationLimit: { type: Number, default: 2 }   // Giới hạn thẻ vàng bị treo giò
        }
    }
});

// Tạo Discriminator: 'Football' là giá trị của sportType
const FootballRule = BaseRule.discriminator('Football', footballRuleSchema);

export default FootballRule;