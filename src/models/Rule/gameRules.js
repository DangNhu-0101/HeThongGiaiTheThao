import mongoose from "mongoose";
import Tournament from "../tournament.js";
import BaseRule from "./baseRules.js";

// Schema cho Serving Rules
const servingRuleSchema = new mongoose.Schema({
    style: {
        type: String,
        enum: ['UNDERHAND', 'OVERHAND', 'SIDEARM'],
        required: true
    },
    rules: [
        {
            type: String
        }
    ],
    letServePolicy: {
        type: String,
        enum: ['PLAY_ON', 'REPLAY_SERVICE', 'DEAD_BALL'],
        default: 'PLAY_ON'
    },
    serviceSequence: {
        doubles: String,
        singles: String
    }
}, { _id: false });

// Schema cho Double Bounce Rule
const doubleBounceRuleSchema = new mongoose.Schema({
    enabled: {
        type: Boolean,
        default: true
    },
    description: String
}, { _id: false });

// Schema cho Non-Volley Zone (Kitchen)
const nonVolleyZoneSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    depth: String,
    rules: [String]
}, { _id: false });

// Main Game Rules Schema
const gameRulesSchema = new mongoose.Schema({
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
    serving: {
        type: servingRuleSchema,
        required: false
    },
    doubleBounceRule: {
        type: doubleBounceRuleSchema,
        required: false
    },
    nonVolleyZone: {
        type: nonVolleyZoneSchema,
        required: false
    },

},
    { timestamps: true });

const GameRule = mongoose.model("GameRule", gameRulesSchema);
export default GameRule;
