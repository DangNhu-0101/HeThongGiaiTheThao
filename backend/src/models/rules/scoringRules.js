// models/ScoringRule.js
import mongoose from 'mongoose';

const scoringRuleSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, trim: true },
    sportType: { type: String, required: true },

    // Hệ thống điểm (thắng, hòa, thua)
    pointSystem: {
        win: { type: Number, default: 3 },
        draw: { type: Number, default: 1 },
        loss: { type: Number, default: 0 }
    },

    // Xử lý bỏ cuộc (walkover)
    walkover: {
        pointsAwarded: { type: Number, default: 3 },
        defaultScoreFor: { type: Number, default: 3 },
        defaultScoreAgainst: { type: Number, default: 0 }
    },

    // Tính điểm theo set/game (cho các môn như tennis, pickleball, cầu lông)
    setsCalculation: {
        isSupported: { type: Boolean, default: false },
        method: { type: String, enum: ['BY_SET_WINS', 'BY_TOTAL_POINTS', ''], default: '' },
        numberOfSets: { type: Number, default: 1 },
        targetScore: { type: Number, default: 11 },
        winByGap: { type: Number, default: 2 },
        changeSideAtPoint: { type: Number, default: 6 }
    },

    // Tính điểm trực tiếp (rally scoring)
    rallyScoring: { type: Boolean, default: false },
    winByTwo: { type: Boolean, default: true },

    // Mở rộng
    customScoring: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

export default mongoose.model('ScoringRule', scoringRuleSchema);