import mongoose from "mongoose";

const ruleSystemSchema = new mongoose.Schema({
    ruleName: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    sport: {
        type: String,
        required: true,
        // Đảm bảo khớp với hàm mapSportName trong script seed
        enum: ['Football', 'Basketball', 'Volleyball', 'Tennis', 'Table Tennis', 'Badminton', 'Pickleball', 'Other']
    },
    version: { type: String, default: "1.0" },
    language: { type: String, default: "vi" },

    // 1. Cấu trúc giải đấu (Categories, Stages, Skill Levels)
    tournamentStructure: {
        categories: [{
            id: String,
            name: String,
            minPlayers: Number
        }],
        skillLevels: [String],
        stages: [{
            stageName: String,
            type: { type: String }, // GROUP_STAGE, KNOCKOUT
            format: { type: String }, // ROUND_ROBIN, SINGLE_ELIMINATION
            scoring: String,
            advanceCriteria: String,
            hasBronzeMatch: { type: Boolean, default: false }
        }]
    },

    // 2. Luật chơi (Serving, Kitchen rule,...)
    // Sử dụng Mixed vì mỗi môn có một bộ luật đặc thù khác nhau hoàn toàn
    gameRules: { type: mongoose.Schema.Types.Mixed },

    // 3. Cấu hình tính điểm (Xương sống của hệ thống)
    scoringConfigurations: {
        standardSideOut: {
            description: String,
            winByTwo: { type: Boolean, default: true },
            formats: [{
                name: String,
                pointsToWin: Number,
                switchSidesAt: Number
            }]
        },
        rallyScoring: {
            enabled: { type: Boolean, default: false },
            description: String,
            pointsToWin: Number
        }
    },

    // 4. Quản lý thời gian
    timeManagement: {
        warmUpMinutes: Number,
        standardTimeOutsPerSet: Number,
        timeOutDurationSeconds: Number,
        medicalTimeOutMinutes: Number,
        betweenSetRestMinutes: Number,
        maxWaitTimeBeforeForfeit: Number
    },

    // 5. Quản lý tài nguyên & Thiết bị
    resourceManagement: { type: mongoose.Schema.Types.Mixed },

    // 6. Lỗi và hình phạt
    faultsAndPenalties: { type: mongoose.Schema.Types.Mixed }

}, {
    timestamps: true,
    versionKey: false
});

const RuleSystem = mongoose.model("RuleSystem", ruleSystemSchema);
export default RuleSystem;