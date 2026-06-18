// models/rules/categories.js
import mongoose from 'mongoose';

const categoryRuleSchema = new mongoose.Schema({
    tournamentItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'TournamentItem', default: null },

    name: { type: String, required: true },         // "Đơn nam"
    sportType: { type: String, required: true },    // "pickleball"
    description: { type: String, trim: true },
    displayName: { type: String, trim: true },

    // Luật cơ bản
    playerSlotsPerTeam: {
        min: { type: Number, default: 1 },
        max: { type: Number, default: 1 }
    },

    // Tham chiếu đến các model luật chi tiết (cho phép null nếu chưa có)
    gameRule: { type: mongoose.Schema.Types.ObjectId, ref: 'GameRule', default: null },
    scoringRule: { type: mongoose.Schema.Types.ObjectId, ref: 'ScoringRule', default: null },
    timeManagementRule: { type: mongoose.Schema.Types.ObjectId, ref: 'TimeManagementRule', default: null },
    resourceManagementRule: { type: mongoose.Schema.Types.ObjectId, ref: 'ResourceManagementRule', default: null },
    faultsAndPenaltiesRule: { type: mongoose.Schema.Types.ObjectId, ref: 'FaultsAndPenalties', default: null },

    // Các trường mở rộng khác
    customFields: { type: mongoose.Schema.Types.Mixed, default: {} },

    status: { type: String, enum: ['actived', 'inactived', 'cancelled'], default: 'actived' }
}, { timestamps: true });

export default mongoose.model('CategoryRule', categoryRuleSchema);