import mongoose from "mongoose";
import Tournament from "../tournaments.js";
import CategoryRule from "./categories.js";
import StageRule from "./stageRules.js";
import GameRule from "./gameRules.js";
import TimeManagementRule from "./timeManagements.js";
import ResourceManagementRule from "./resourceManagements.js";
import FaultsAndPenalties from "./faultsAndPenalties.js";
// Cấu hình chung cho Discriminator


const baseRuleSchema = new mongoose.Schema({

    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament',
        required: false,
        index: true
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
        enum: ['Soccer', 'Basketball', 'Volleyball', 'Tennis', 'Table Tennis', 'Badminton', 'Pickleball', 'Esports', 'Other']
    },

    feeEntry:{
        type: Number,
        default: 0
    },

    teamComposition: { // Số cầu thủ tối thiểu
        maxTeams: { type: Number, default: 32 },           // Tổng số đội tối đa
        minTeams: { type: Number, default: 2 }             // Tổng số đội tối thiểu
    },

    timeLine: {
        timeRegiter: { type: Date, default: null },
        timeCloseRegister: { type: Date, default: null },
        timeOpen: { type: Date, default: Date.now },
        timeClose: { type: Date, default: null }
    },

    tournamentStructure:{
        categories:[{
            type:mongoose.Schema.Types.ObjectId,
            ref: 'CategoryRule',}],
        
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

    }   
, { timestamps: true });

baseRuleSchema.index({ sport: 1, ruleName: 1 }, { unique: true });

const BaseRule = mongoose.model("BaseRule", baseRuleSchema);
export default BaseRule;