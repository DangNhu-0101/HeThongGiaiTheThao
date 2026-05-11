import mongoose from "mongoose";
import Tournament from "../tournaments.js";
import BaseRule from "./baseRules.js";

// Schema cho Courts
const courtsSchema = new mongoose.Schema({
    minRequired: {
        type: Number,
        required: true
    },
    dimensions: String,
    surfaceType: [String]
}, { _id: false });

// Schema cho Personnel Per Match
const personnelPerMatchSchema = new mongoose.Schema({
    mainReferee: {
        type: Number,
        default: 1
    },
    lineJudges: {
        type: Number,
        default: 0
    },
    scoreKeepers: {
        type: Number,
        default: 1
    },
    linesmen: {
        type: Number,
        default: 0
    }
}, { _id: false });

// Schema cho Equipment
const equipmentSchema = new mongoose.Schema({
    ballType: String,
    netHeightCenter: String,
    courtSurface: String,
    otherEquipment: [String]
}, { _id: false });

// Main Resource Management Rules Schema
const resourceManagementRulesSchema = new mongoose.Schema({
    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament',
        required: false
    },
        baseRuleId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BaseRule',
        required: true
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
    courts: {
        type: courtsSchema,
        required: false
    },
    personnelPerMatch: {
        type: personnelPerMatchSchema,
        required: false
    },
    equipment: {
        type: equipmentSchema,
        required: false
    },
}, 
    { timestamps: true });

const ResourceManagementRule = mongoose.model("ResourceManagementRule", resourceManagementRulesSchema);
export default ResourceManagementRule;
