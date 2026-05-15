import mongoose from "mongoose";
import Tournament from "../tournaments.js";
import BaseRule from "./baseRules.js";
import ScoringRule from "./scoringRules.js";
import Bracket from "./brackets.js";

// Schema cho Stage Configuration
const stageConfigSchema = new mongoose.Schema({
    stageName: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['GROUP_STAGE', 'KNOCKOUT', 'SWISS_SYSTEM', 'DOUBLE_ELIMINATION', 'SINGLE_ELIMINATION', 'OTHER']
    },
    format: {
        type: String,
        enum: ['ROUND_ROBIN', 'SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION', 'SWISS_SYSTEM', 'OTHER']
    },
    scoring: String,
    advanceCriteria: String,
    hasBronzeMatch: {
        type: Boolean,
        default: false
    },
    numberOfGroups: Number,
    playersPerGroup: Number,
    description: String
}, { _id: false });

// Main Stage Rules Schema
const stageRulesSchema = new mongoose.Schema({
    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament',
        required: false
    },
    baseRuleId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BaseRule'
    },
    sport: {
        type: String,
        required: true,
        enum: ['Soccer', 'Basketball', 'Volleyball', 'Tennis', 'Table Tennis', 'Badminton', 'Pickleball', 'Other']
    },
    ruleName: {
        type: String,
        required: true,
        trim: true
    },
    scoringRuleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ScoringRule',
        default: null
        },
    stages: [stageConfigSchema],
    bracketSize: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bracket',
    }],
    timeLine:{
        dateStart:{
            type: Date,
            required: true
        },
        dateEnd:{
            type:Date,
            required: true
        }
    }
}, { timestamps: true });

const StageRule = mongoose.model("StageRule", stageRulesSchema);
export default StageRule;
