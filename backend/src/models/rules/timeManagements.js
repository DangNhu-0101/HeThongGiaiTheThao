// models/TimeManagementRule.js
import mongoose from 'mongoose';

const timeManagementRuleSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, trim: true },
    sportType: { type: String, required: true },

    // Hiệp/set
    periods: {
        numberOfPeriods: { type: Number, default: 2 },   // 2 hiệp bóng đá, 3 set tennis,...
        durationPerPeriod: { type: Number, default: 45 }, // phút
        halfTimeBreak: { type: Number, default: 15 }      // phút nghỉ giữa hiệp
    },

    // Timeout
    timeouts: {
        allowed: { type: Boolean, default: false },
        countPerMatch: { type: Number, default: 0 },
        durationSeconds: { type: Number, default: 60 }
    },

    warmUpMinutes: { type: Number, default: 5 },
    medicalTimeOutMinutes: { type: Number, default: 15 },
    betweenSetRestMinutes: { type: Number, default: 2 },
    maxWaitTimeBeforeForfeit: { type: Number, default: 15 },

    changeSideAt: { type: String, default: 'HALF_TIME' }, // hoặc 'SET_END', ...

    customTimeRules: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

export default mongoose.model('TimeManagementRule', timeManagementRuleSchema);