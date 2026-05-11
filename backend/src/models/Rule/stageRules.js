import mongoose from "mongoose";

// Schema cho Stage Configuration (Đã cập nhật để khớp form DynamicStageConfig)
const stageConfigSchema = new mongoose.Schema({
    stageName: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['GROUP_STAGE', 'KNOCKOUT', 'ROUND_ROBIN', 'SWISS_SYSTEM', 'DOUBLE_ELIMINATION', 'SINGLE_ELIMINATION', 'OTHER']
    },
    format: {
        type: String,
        enum: ['ROUND_ROBIN', 'SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION', 'SWISS_SYSTEM', 'OTHER']
    },
    scoring: String,
    
    // --- KHỐI 1: CHIA NHÁNH (MỚI) ---
    hasBranches: { type: Boolean, default: false },
    branchCount: { type: Number, default: 1 },

    // --- KHỐI 2: VÒNG BẢNG ---
    numberOfGroups: Number,
    playersPerGroup: Number,
    advanceCriteria: String,

    // --- KHỐI 3: LOẠI TRỰC TIẾP ---
    hasBronzeMatch: {
        type: Boolean,
        default: false
    },

    // --- KHỐI 4: VÉ VỚT (MỚI) ---
    hasWildcards: { type: Boolean, default: false },
    wildcardsCount: { type: Number, default: 0 },

    description: String
}, { _id: false });

// Main Stage Rules Schema (Giữ nguyên như cũ của bạn)
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
        enum: ['Football', 'Basketball', 'Volleyball', 'Tennis', 'Table Tennis', 'Badminton', 'Pickleball', 'Other']
    },
    ruleName: {
        type: String,
        required: true,
        trim: true
    },
    ScoringRule: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ScoringRule',
        default: null
    },
    stages: [stageConfigSchema], 
    bracketSize: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bracket',
    }],
}, { timestamps: true });

const StageRule = mongoose.model("StageRule", stageRulesSchema);
export default StageRule;