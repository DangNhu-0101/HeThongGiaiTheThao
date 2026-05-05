import mongoose from "mongoose";
import BaseRule from "./baseRules.js";

const volleyballRuleSchema = new mongoose.Schema({
    volleyballConfig: {
        // 1. HÌNH THỨC THI ĐẤU
        matchType: {
            type: String,
            enum: ['Indoor', 'Beach'], // Bóng chuyền trong nhà (6v6) hoặc Bãi biển (2v2)
            required: true
        },

        // 2. CẤU TRÚC SET (Giống Racket nhưng có Set cuối khác biệt)
        setsToWin: {
            type: Number,
            enum: [2, 3],
            default: 3 // Thắng 3/5 set là phổ biến nhất
        },
        pointsRegularSet: { type: Number, default: 25 }, // Set 1-4 đấu đến 25
        pointsFinalSet: { type: Number, default: 15 },   // Set 5 (deciding set) đấu đến 15

        winCondition: {
            winByTwo: { type: Boolean, default: true }, // Luôn phải thắng cách 2 điểm
            maxPointCap: { type: Number, default: null } // Thường bóng chuyền không có điểm trần
        },

        // 3. QUY ĐỊNH NHÂN SỰ ĐẶC THÙ
        roster: {
            playersOnField: { type: Number, default: 6 },
            allowLibero: { type: Boolean, default: true }, // Có sử dụng cầu thủ tự do không
            maxSubstitutionsPerSet: { type: Number, default: 6 } // Số lần thay người mỗi set
        },

        // 4. LUẬT TRẬN ĐẤU
        matchRules: {
            maxTouches: { type: Number, default: 3 }, // Tối đa 3 lần chạm bóng (không tính chắn bóng)
            allowNetTouch: { type: Boolean, default: false },
            technicalTimeouts: { type: Number, default: 2 } // Số lần hội ý kỹ thuật
        }
    }
});

const VolleyballRule = BaseRule.discriminator('Volleyball', volleyballRuleSchema);

export default VolleyballRule;