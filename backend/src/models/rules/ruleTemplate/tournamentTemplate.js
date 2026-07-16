// models/rules/tournamentTemplate.js
import mongoose from 'mongoose';

const tournamentTemplateSchema = new mongoose.Schema({
    templateName: { type: String, required: true, unique: true },
    name: { type: String, trim: true },
    slug: { type: String, trim: true },
    description: { type: String, trim: true },
    sportType: { type: String, required: true },
    version: { type: String, default: '1.0' },
    language: { type: String, default: 'vi' },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CategoryTemplate' }],
    stages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'StageTemplate' }],
    stageType: { type: String, trim: true },
    groupConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
    roundRobinConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
    knockoutConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
    doubleEliminationConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
    rankingCriteria: { type: mongoose.Schema.Types.Mixed, default: [] },
    advancementRules: { type: mongoose.Schema.Types.Mixed, default: [] },
    seedingRules: { type: mongoose.Schema.Types.Mixed, default: {} },
    defaultSettings: { type: mongoose.Schema.Types.Mixed, default: {} },
    templateConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
    isActive: { type: Boolean, default: true },
    status: { type: String, enum: ['actived', 'inactived'], default: 'actived' }
}, { timestamps: true });

export default mongoose.model('TournamentTemplate', tournamentTemplateSchema);
