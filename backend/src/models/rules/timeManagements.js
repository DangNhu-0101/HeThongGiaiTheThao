// models/rules/timeManagementRule.js
import mongoose from 'mongoose';

const timeManagementRuleSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, trim: true },
    sportType: { type: String, required: true },
    periods: {
        numberOfPeriods: { type: Number, default: 2 },
        durationPerPeriod: { type: Number, default: 45 },
        halfTimeBreak: { type: Number, default: 15 }
    },
    timeouts: {
        allowed: { type: Boolean, default: false },
        countPerMatch: { type: Number, default: 0 },
        durationSeconds: { type: Number, default: 60 }
    },
    warmUpMinutes: { type: Number, default: 5 },
    medicalTimeOutMinutes: { type: Number, default: 15 },
    betweenSetRestMinutes: { type: Number, default: 2 },
    maxWaitTimeBeforeForfeit: { type: Number, default: 15 },
    changeSideAt: { type: String, default: 'HALF_TIME' },
    customTimeRules: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ['actived', 'inactived'], default: 'actived' }
}, { timestamps: true });

export default mongoose.model('TimeManagementRule', timeManagementRuleSchema);