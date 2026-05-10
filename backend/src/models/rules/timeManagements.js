import mongoose from "mongoose";
import Tournament from "../tournament.js";
import BaseRule from "./baseRules.js";
// Main Time Management Rules Schema
const timeManagementRulesSchema = new mongoose.Schema({
    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament',
        required: false
    },
    baseRuleId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BaseRule',
        required: false
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
    description: String,
    warmUpMinutes: {
        type: Number,
        required: false,
        default: 5
    },
    standardTimeOutsPerSet: {
        type: Number,
        required: false,
        default: 2
    },
    timeOutDurationSeconds: {
        type: Number,
        required: false,
        default: 60
    },
    medicalTimeOutMinutes: {
        type: Number,
        required: false,
        default: 15
    },
    betweenSetRestMinutes: {
        type: Number,
        required: false,
        default: 2
    },
    maxWaitTimeBeforeForfeit: {
        type: Number,
        required: false,
        default: 15
    },

}, { timestamps: true });

const TimeManagementRule = mongoose.model("TimeManagementRule", timeManagementRulesSchema);
export default TimeManagementRule;
