// models/Group.js
import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    groupCode: { type: String, default: '' },
    branchName: { type: String, default: '' },
    branchIndex: { type: Number, default: 1 },
    groupIndex: { type: Number, default: 1 },
    bracketId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bracket',
    },
    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament',
        required: true,
        index: true
    },
    sport: {
        type: String,
        required: true
    },
    stageRuleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StageRule',
    },
    teamInGroup: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
    }],

    standings: [{
        teamId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team',
            default: null
        },
        slotCode: { type: String, default: '' },
        placeholderName: { type: String, default: '' },
        sourceLabel: { type: String, default: '' },
        rank: { type: Number, default: 0 },
        played: { type: Number, default: 0 },
        wins: { type: Number, default: 0 },
        draws: { type: Number, default: 0 },
        losses: { type: Number, default: 0 },
        goalsFor: { type: Number, default: 0 },
        goalsAgainst: { type: Number, default: 0 },
        goalDifference: { type: Number, default: 0 },
        points: { type: Number, default: 0 }
    }],

    status: {
        type: String,
        enum: ['pending', 'progress', 'completed'],
        default: 'pending'
    }
}, { timestamps: true });

// Tạo index để tối ưu query
groupSchema.index({ bracketId: 1 });
groupSchema.index({ stageRuleId: 1 });
groupSchema.index({ tournamentId: 1, sport: 1 });

const Group = mongoose.model('Group', groupSchema);
export default Group;
