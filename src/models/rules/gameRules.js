import mongoose from "mongoose";
import BaseRule from "./baseRules.js";
import Tournament from "../tournaments.js";

const gameRulesSchema = new mongoose.Schema({
    tournamentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Tournament', 
        required: false 
    },
    baseRuleId: { type: mongoose.Schema.Types.ObjectId, 
        ref: 'BaseRule', 
        required: true 
    },
    sport: { type: String, 
        required: true, 
        enum: ['Football', 'Basketball', 'Volleyball', 'Tennis', 'Table Tennis', 'Badminton', 'Pickleball', 'Other'] 
    },
    ruleName: { type: String, 
        required: true, 
        trim: true },
    description: String,
    rules: { type: mongoose.Schema.Types.Mixed, 
        required: true 
    }   // lưu toàn bộ cấu hình luật đặc thù môn
}, { timestamps: true, versionKey: false });

const GameRule = mongoose.model("GameRule", gameRulesSchema);
export default GameRule;