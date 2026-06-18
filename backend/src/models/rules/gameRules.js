// models/rules/gameRule.js
import mongoose from 'mongoose';

const gameRuleSchema = new mongoose.Schema({
    name: { type: String, required: true },          // Tên luật, vd: "Pickleball Singles Rules"
    description: { type: String, trim: true },
    sportType: { type: String, required: true },     // "pickleball", "tennis", ...

    // Số người mỗi đội
    playersPerTeam: { type: Number, required: true },

    // Quy định thay người
    substitutions: {
        allowed: { type: Boolean, default: false },
        maxSubs: { type: Number, default: 0 },
        type: { type: String, enum: ['LIMITED', 'ROLLING', 'MEDICAL_ONLY', 'NONE'], default: 'NONE' }
    },

    // Luật giao bóng
    serving: {
        style: { type: String, enum: ['UNDERHAND', 'OVERHAND', 'ANY'], default: 'UNDERHAND' },
        serviceSequence: { type: String, enum: ['SINGLES_SEQUENCE', 'DOUBLES_SEQUENCE', 'ALTERNATE'], default: 'SINGLES_SEQUENCE' },
        letServePolicy: { type: String, enum: ['PLAY_ON', 'REPLAY'], default: 'PLAY_ON' },
        alternateGender: { type: Boolean, default: false } // cho đôi nam nữ
    },

    // Pickleball-specific
    doubleBounceRule: { type: Boolean, default: false },
    nonVolleyZone: {
        enabled: { type: Boolean, default: false },
        depth: { type: String, default: '' }  // "7 feet"
    },

    // Bóng đá, bóng rổ, ...
    hasVAR: { type: Boolean, default: false },

    // Các trường mở rộng
    customRules: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Trạng thái
    status: { type: String, enum: ['actived', 'inactived'], default: 'actived' }
}, { timestamps: true });

// Index cho tìm kiếm
gameRuleSchema.index({ sportType: 1, name: 1 });

export default mongoose.model('GameRule', gameRuleSchema);