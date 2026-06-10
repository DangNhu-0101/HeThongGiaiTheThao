// models/rules/tournamentTemplate.js
import mongoose from 'mongoose';

const tournamentTemplateSchema = new mongoose.Schema({
    templateName: { type: String, required: true, unique: true },
    sportType: { type: String, required: true },
    version: { type: String, default: '1.0' },
    language: { type: String, default: 'vi' },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CategoryTemplate' }],
    stages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'StageTemplate' }],
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

export default mongoose.model('TournamentTemplate', tournamentTemplateSchema);