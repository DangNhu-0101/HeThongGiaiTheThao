// models/Group.js
import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    tournamentItemId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'TournamentItem'
    },
    bracketId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bracket',
    },
    sport: {
        type: String,
        required: true
    },
    stageRuleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StageRule',
    },

    status: {
        type: String,
        enum: ['pending', 'progress', 'completed'],
        default: 'pending'
    }
}, { timestamps: true });

// Tạo index để tối ưu query
groupSchema.index({ bracketId: 1 });
groupSchema.index({ stageRuleId: 1 });

const Group = mongoose.model('Group', groupSchema);
export default Group;