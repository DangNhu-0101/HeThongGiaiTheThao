import mongoose from "mongoose";

const branchSchema = new mongoose.Schema({
    name: { type: String, default: 'Nhanh chinh' },
    numberOfGroups: { type: Number, required: true },
    playersPerGroup: { type: Number, required: true },
    selectedRanks: [{ type: Number }]
}, { _id: true });

const substageSchema = new mongoose.Schema({
    stageName: { type: String, required: true },
    type: { type: String, enum: ['GROUP_STAGE', 'KNOCKOUT'], default: 'GROUP_STAGE' },
    hasBranches: { type: Boolean, default: false },
    branches: [branchSchema],
    knockoutRound: { type: String, default: '' },
    hasBronzeMatch: { type: Boolean, default: false },
    totalTeamsIn: { type: Number, default: 0 },
    hasWildcards: { type: Boolean, default: false },
    wildcardsCount: { type: Number, default: 0 },
    wildcardCriteria: [{ type: String }],
    wildcardPriorityOrder: [{ type: String }],
    winPoints: { type: Number, default: 1 },
    lossPoints: { type: Number, default: 0 },
    rankingCriteria: [{ type: String }],
    rankingPriorityOrder: [{ type: String }],
    matchFormat: { type: String, default: '1_SET' },
    matchDuration: { type: Number, default: 60 },
    touchPoint: { type: Number, default: 11 },
    winByGap: { type: Number, default: 1 },
    maxPoints: { type: Number, default: null },
    changeSideAt: { type: Number, default: 6 },
    substages: [{ type: mongoose.Schema.Types.Mixed }]
}, { _id: true, strict: false });

const stageSchema = new mongoose.Schema({
    baseRuleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BaseRule',
        default: null,
        index: true
    },
    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament',
        required: true,
        index: true
    },
    sportType: { type: String, required: true },
    formatDescription: { type: String, default: '' },
    ruleDescription: { type: String, default: '' },
    ruleName: { type: String, default: '' },
    stageName: { type: String, required: true },
    type: { type: String, enum: ['GROUP_STAGE', 'KNOCKOUT'], default: 'GROUP_STAGE' },
    numberOfGroups: { type: Number, default: 1 },
    playersPerGroup: { type: Number, default: 4 },
    hasBranches: { type: Boolean, default: false },
    branches: [branchSchema],
    knockoutRound: { type: String, default: '' },
    hasBronzeMatch: { type: Boolean, default: false },
    totalTeamsIn: { type: Number, default: 0 },
    hasWildcards: { type: Boolean, default: false },
    wildcardsCount: { type: Number, default: 0 },
    wildcardCriteria: [{ type: String }],
    wildcardPriorityOrder: [{ type: String }],
    winPoints: { type: Number, default: 1 },
    lossPoints: { type: Number, default: 0 },
    rankingCriteria: [{ type: String }],
    rankingPriorityOrder: [{ type: String }],
    matchFormat: { type: String, default: '1_SET' },
    matchDuration: { type: Number, default: 60 },
    touchPoint: { type: Number, default: 11 },
    winByGap: { type: Number, default: 1 },
    maxPoints: { type: Number, default: null },
    changeSideAt: { type: Number, default: 6 },
    substages: [{ type: mongoose.Schema.Types.Mixed }],
    stages: [{ type: mongoose.Schema.Types.Mixed }],
    bracketIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bracket',
    }]
}, { timestamps: true });

stageSchema.index({ tournamentId: 1, sportType: 1 });

const StageRule = mongoose.model("StageRule", stageSchema);
export default StageRule;
