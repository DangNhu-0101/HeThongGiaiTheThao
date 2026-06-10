// models/rules/categories.js
import mongoose from 'mongoose';

const categoryRuleSchema = new mongoose.Schema({
    tuornamentItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TournamentItem'
    }, 

    name: { type: String, required: true },         // "Đơn nam"
    sportType: { type: String, required: true },    // "pickleball"
    description: { type: String, trim: true },
    displayName:{type:String, trim: true},

    // Luật cơ bản
    playerSlotsPerTeam: {
        min: { type: Number, default: 1 },
        max: { type: Number, default: 1 }
    },

    // Các luật chi tiết (dạng object linh hoạt, không cố định schema)
    gameRules: { type: mongoose.Schema.Types.Mixed, default: {} },
    scoringRules: { type: mongoose.Schema.Types.Mixed, default: {} },
    timeManagementRules: { type: mongoose.Schema.Types.Mixed, default: {} },
    resourceManagementRules: { type: mongoose.Schema.Types.Mixed, default: {} },
    faultsAndPenaltiesRules: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Các trường mở rộng khác
    customFields: { type: mongoose.Schema.Types.Mixed, default: {} },

    status: {
        type: String,
        enum: ['active', 'inactive', 'cancelled'],
        default: 'active'
    }
}, { timestamps: true });

export default mongoose.model('CategoryRule', categoryRuleSchema);