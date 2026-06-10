// models/ResourceManagementRule.js
import mongoose from 'mongoose';

const resourceManagementRuleSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, trim: true },
    sportType: { type: String, required: true },

    courts: {
        minRequired: { type: Number, default: 1 },
        dimensions: { type: String, default: '' },    // "20x44 feet"
        surfaceType: { type: String, default: '' },   // "Hard Court", "Grass"
        netHeight: { type: String, default: '' }      // "34 inches"
    },

    personnel: {
        mainReferee: { type: Number, default: 1 },
        lineJudges: { type: Number, default: 0 },
        scoreKeepers: { type: Number, default: 1 }
    },

    equipment: {
        ballType: { type: String, default: '' },
        other: { type: mongoose.Schema.Types.Mixed, default: {} }
    },

    customResources: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

export default mongoose.model('ResourceManagementRule', resourceManagementRuleSchema);