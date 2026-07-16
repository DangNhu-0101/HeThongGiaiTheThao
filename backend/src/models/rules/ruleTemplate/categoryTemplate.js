// models/rules/categoryTemplate.js
import mongoose from 'mongoose';

const categoryTemplateSchema = new mongoose.Schema({
    code: { type: String, required: true },        // "MS", "MD", "WS", ...
    name: { type: String, required: true },        // "Đơn Nam"
    sportType: { type: String, required: true },   // "pickleball", "soccer"
    playerSlotsPerTeam: {
        min: { type: Number, default: 1 },
        max: { type: Number, default: 1 }
    },
    gameRules: { type: mongoose.Schema.Types.Mixed, default: {} },
    scoringRules: { type: mongoose.Schema.Types.Mixed, default: {} },
    timeManagementRules: { type: mongoose.Schema.Types.Mixed, default: {} },
    resourceManagementRules: { type: mongoose.Schema.Types.Mixed, default: {} },
    faultsAndPenaltiesRules: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ['actived', 'inactived'], default: 'actived' }
}, { timestamps: true });

categoryTemplateSchema.index({ sportType: 1, code: 1 }, { unique: true });

export default mongoose.model('CategoryTemplate', categoryTemplateSchema);