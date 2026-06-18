// models/rules/stageTemplate.js
import mongoose from 'mongoose';

const stageTemplateSchema = new mongoose.Schema({
    name: { type: String, required: true },         // "Vòng bảng Pickleball"
    sportType: { type: String, required: true },
    type: { type: String, enum: ['GROUP_STAGE', 'KNOCKOUT'], required: true },
    format: { type: String },                       // "ROUND_ROBIN", "SINGLE_ELIMINATION"
    scoring: { type: String },                      // "BEST_OF_3_TO_11"
    advanceCriteria: { type: String },              // "TOP_2_PER_GROUP"
    config: { type: mongoose.Schema.Types.Mixed, default: {} }, // chứa hasBronzeMatch, teamCount, ...
    status: { type: String, enum: ['actived', 'inactived'], default: 'actived' }
}, { timestamps: true });

export default mongoose.model('StageTemplate', stageTemplateSchema);