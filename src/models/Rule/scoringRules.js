import mongoose from "mongoose";
import Tournament from "../tournament.js";
import BaseRule from "./baseRules.js";

// Schema cho Scoring Format
const scoringFormatSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    pointsToWin: {
        type: Number,
        required: true
    },
    switchSidesAt: {
        type: Number,
        required: false
    }
}, { _id: false });

// Schema cho Standard Side Out
const standardSideOutSchema = new mongoose.Schema({
    description: String,
    winByTwo: {
        type: Boolean,
        default: false
    },
    formats: [scoringFormatSchema]
}, { _id: false });

// Schema cho Rally Scoring
const rallyScoringSchema = new mongoose.Schema({
    enabled: {
        type: Boolean,
        default: false
    },
    description: String,
    pointsToWin: Number
}, { _id: false });

// Main Scoring Rules Schema
const scoringRulesSchema = new mongoose.Schema({
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
        enum: ['Football', 'Basketball', 'Volleyball', 'Tennis', 'Table Tennis', 'Badminton', 'Pickleball', 'Other']
    },
    ruleName: {
        type: String,
        required: true,
        trim: true
    },
    description: String,
    standardSideOut: {
        type: standardSideOutSchema,
        required: false
    },
    rallyScoring: {
        type: rallyScoringSchema,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const ScoringRule = mongoose.model("ScoringRule", scoringRulesSchema);
export default ScoringRule;
