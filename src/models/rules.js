import mongoose from "mongoose";

const ruleSchema = new mongoose.Schema({
    ruleName: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },

    registration: {
        minPlayers: { type: Number, },
        maxPlayers: { type: Number, required: true },
        entryFee: { type: Number, required: true },
        maxTeams: { type: Number, required: true }
    },
    matchConfig: {
        matchRules: { type: String, required: true },
        halfDuration: { type: Number, required: true },
        pointsWin: { type: Number, required: true },
        pointsDraw: { type: Number, required: true },
        pointsLoss: { type: Number, required: true }
    },
    disciplineFines: {
        yellowCard: { type: Number, required: true },
        redCard: { type: Number, required: true },
        teamLateFine: { type: Number, required: true }
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