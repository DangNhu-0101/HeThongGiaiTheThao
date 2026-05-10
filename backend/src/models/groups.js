// group
import Team from "./teams.js";
import mongoose from "mongoose";
import StageRule from "./rules/stageRules.js";
import Bracket from "./rules//bracket.js";

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    bracketId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bracket',
    },
    sport: { type: String, required: true },

    stageRuleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StageRule',
    },

    teamInGroup: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
    }],

    standingBoarnd:{
        played: { type: Number, default: 0 },   // ĐĐ
        wins: { type: Number, default: 0 },     // Thắng
        draws: { type: Number, default: 0 },    // Hòa
        losses: { type: Number, default: 0 },   // Thua
        goalsFor: { type: Number, default: 0 }, // Bàn thắng (để tính HS)
        goalsAgainst: { type: Number, default: 0 }, // Bàn thua (để tính HS)
        goalDifference: { type: Number, default: 0 }, // HS (goalsFor - goalsAgainst)
        points: { type: Number, default: 0 }
    },

    status:{
        type: String,
        enum: ['pending', 'progress', 'completed'],
        default: 'pending'
    }
}, { timestamps: true }
);

const Group = mongoose.model('Group', groupSchema);
export default Group;