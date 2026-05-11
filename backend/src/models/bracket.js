import mongoose from "mongoose";
import Group from "./tables.js";
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


    name: {
        type: String,
        required: true,
    },

    numberOfGroup:{
        type: Number,
        required: true,
    },

    group:[{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    }]



});

const Bracket = mongoose.model("Bracket", bracketSchema);
export default Bracket;