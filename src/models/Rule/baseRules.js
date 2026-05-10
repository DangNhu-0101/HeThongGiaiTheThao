import mongoose from "mongoose";
import ScoringRule from "./scoringRules.js";
import StageRule from "./stageRules.js";
import CategoryRule from "./categoryRules.js";
import GameRule from "./gameRules.js";
import TimeManagementRule from "./timeManagementRules.js";
import ResourceManagementRule from "./resourceManagementRules.js";
import FaultsAndPenalties from "./faultsAndPenalties.js";
import Tournament from "../tournament.js";

// Cấu hình chung cho Discriminator


const baseRuleSchema = new mongoose.Schema({

    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament',
        required: false
    },
    // 1. THÔNG TIN ĐỊNH DANH
    ruleName: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    description: { type: String },

    // 2. PHÂN LOẠI CƠ BẢN (Core Classification)
    sport: {
        type: String,
        required: true,
        enum: ['Football', 'Basketball', 'Volleyball', 'Tennis', 'Table Tennis', 'Badminton', 'Pickleball', 'Esports', 'Other']
    },

    feeEntry:{
        type: Number,
        default: 0
    },

    Teamcomposition:{
        maxteam:{type: Number, default: 1},
        minTeam:{type: Number, default: 1},
    },

    tournamentStructure:{
        categories:[{
            type:mongoose.Schema.Types.ObjectId,
            ref: 'CategoryRule',}]
        },
        stages: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'StageRule',}],
        gamerules: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'GameRule',

        }],
        ScoringRule: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ScoringRule',
            default: null
        }],
        timeManagementRule: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TimeManagementRule',
        }],
        resourceManagementRule: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ResourceManagementRule',
            default: null
        }],
        faultsAndPenalties:[{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FaultAndPenaltyRule',
        }]

    }
, { timestamps: true });

const BaseRule = mongoose.model("BaseRule", baseRuleSchema);
export default BaseRule;