import mongoose from "mongoose";
import Tournament from "../tournament.js";
import BaseRule from "./baseRules.js";

// Schema con cho tournamentStructure – khá chuẩn chung
const tournamentStructureSchema = new mongoose.Schema(
    {
        categories: [
            {
                id: String,
                name: String,
                minPlayers: Number,
            },
        ],
        skillLevels: [String],
        stages: [
            {
                stageName: String,
                type: String, // GROUP_STAGE, KNOCKOUT
                format: String, // ROUND_ROBIN, SINGLE_ELIMINATION,...
                scoring: String, // "3_POINTS_FOR_WIN", "BEST_OF_3_TO_11", ...
                advanceCriteria: String,
                hasBronzeMatch: Boolean,
            },
        ],
    },
    { _id: false }
);

// Schema con cho scoring – khá giống nhau giữa các môn
const scoringConfigSchema = new mongoose.Schema(
    {
        standardSideOut: {
            description: String,
            winByTwo: Boolean,
            formats: [
                {
                    name: String,
                    pointsToWin: Number,
                    switchSidesAt: Number,
                },
            ],
        },
        rallyScoring: {
            enabled: Boolean,
            description: String,
            pointsToWin: Number,
        },
    },
    { _id: false }
);

// Schema con cho timeManagement – có thể dùng chung
const timeManagementSchema = new mongoose.Schema(
    {
        warmUpMinutes: Number,
        standardTimeOutsPerSet: Number,
        timeOutDurationSeconds: Number,
        medicalTimeOutMinutes: Number,
        betweenSetRestMinutes: Number,
        maxWaitTimeBeforeForfeit: Number,
    },
    { _id: false }
);

// Schema chính: dùng Mixed cho những phần đặc thù môn
const ruleSystemSchema = new mongoose.Schema(
    {
        ruleName: { type: String, required: true, unique: true },
        sportType: {
            type: String,
            required: true,
            enum: ["football", "pickleball", "basketball", "tennis", "badminton", "volleyball", "other"],
        },
        version: { type: String, default: "1.0" },
        language: { type: String, default: "vi" },

        // Các phần có cấu trúc gần như chuẩn chung
        tournamentStructure: tournamentStructureSchema,
        scoringConfigurations: scoringConfigSchema,
        timeManagement: timeManagementSchema,

        // Các phần hoàn toàn linh hoạt theo môn
        gameRules: { type: mongoose.Schema.Types.Mixed, required: true }, // serving, doubleBounce, kitchen, penalty area, v.v.
        resourceManagement: { type: mongoose.Schema.Types.Mixed, required: true }, // courts, personnel, equipment
        faultsAndPenalties: { type: mongoose.Schema.Types.Mixed, required: true }, // thẻ, lỗi kỹ thuật, v.v.
    },
    { timestamps: true, versionKey: false }
);

export const RuleSystem = mongoose.model("RuleSystem", ruleSystemSchema);