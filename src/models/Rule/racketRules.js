import mongoose from "mongoose";
import BaseRule from "./baseRules.js"; 

const racketRuleSchema = new mongoose.Schema({
    racketConfig: {
        // 1. PHÂN LOẠI CHI TIẾT
        subSportType: {
            type: String,
            enum: ['Pickleball', 'Tennis', 'Badminton', 'TableTennis'],
            required: true
        },

        // 2. CẤU TRÚC SET & ĐIỂM SỐ
        setsToWin: {
            type: Number,
            enum: [1, 2, 3],
            default: 2, // Thắng 2/3 set hoặc 3/5 set
        },
        //điểm chạm
        pointsPerSet: {
            type: Number,
            required: true,
        },

        // 3. LOGIC KẾT THÚC SET (Điểm chạm)
        winCondition: {
            winByTwo: {
                type: Boolean,
                default: true,
            },
            maxPointCap: {
                type: Number,
            }
        },


        // 5. CHI TIẾT THI ĐẤU (Tùy chọn)
        hasTieBreak: { type: Boolean, default: false },
        serviceRules: {
            type: String,
            enum: ['Underhand', 'Overhead', 'Any'],
            default: 'Any'
        }
    }
});

// Đăng ký Discriminator với tên 'RacketSport'
const RacketRule = BaseRule.discriminator('RacketSport', racketRuleSchema);

export default RacketRule;