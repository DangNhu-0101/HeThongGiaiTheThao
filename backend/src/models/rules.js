import mongoose from "mongoose";

const ruleSchema = new mongoose.Schema({
    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament',
        required: true,
        unique: true,
        index: true
    },
    sportType: {
        type: String,
        default: ''
    },
    formatDescription: {
        type: String,
        default: ''
    },
    ruleDescription: {
        type: String,
        default: ''
    },
    stageTree: [{
        type: mongoose.Schema.Types.Mixed
    }],
    stages: [{
        type: mongoose.Schema.Types.Mixed
    }],
    ruleName: {
        type: String,
        default: '',
        trim: true,
    },

    registration: {
        minPlayers: { type: Number, },
        maxPlayers: { type: Number },
        entryFee: { type: Number },
        maxTeams: { type: Number }
    },
    matchConfig: {
        matchRules: { type: String },
        halfDuration: { type: Number },
        pointsWin: { type: Number },
        pointsDraw: { type: Number },
        pointsLoss: { type: Number }
    },
    disciplineFines: {
        yellowCard: { type: Number },
        redCard: { type: Number },
        teamLateFine: { type: Number }
    },

    rankingCriteria: {
        type: [String],
        default: ['points', 'scoreDiff', 'goalFor']
    }
},
    {
        timestamps: true
    });

const Rule = mongoose.model("Rule", ruleSchema);
export default Rule;
