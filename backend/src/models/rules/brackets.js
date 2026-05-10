import mongoose from "mongoose";
import Group from "..groups.js";
import StageRule from "./Rule/stageRules.js";

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
    },

    groups:[{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    }]

});

const Bracket = mongoose.model("Bracket", bracketSchema);
export default Bracket;