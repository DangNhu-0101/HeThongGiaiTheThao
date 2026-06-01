import mongoose from "mongoose";
import Group from "../groups.js";
import StageRule from "./stageRules.js";

const bracketSchema = new mongoose.Schema({
    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament',
        required: true
    },

    stageId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StageRule',
    },
    sport: { type: String, required: true },

    name: {
        type: String,
        required: true,
    },

    numberOfGroup:{
        type: Number,
        required: true,
        default: 0,
    },
    totalTeams: { type: Number, default: 0 },
    currentRound: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['pending', 'progress', 'completed'],
        default: 'pending'
    },
    placeholderTeams: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
    }],

    groups:[{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    }]

});

const Bracket = mongoose.model("Bracket", bracketSchema);
export default Bracket;
