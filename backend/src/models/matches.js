import mongoose from "mongoose";

const matchSchema = new mongoose.Schema({
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true, index: true },
    matchcode: { type: String, required: true, unique: true },

    // Liên kết trận tiếp theo (dùng cho knock-out)
    nextMatchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', default: null },
    nextMatchSlot: { type: String, enum: ['team1', 'team2'], default: null },

    bracketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bracket', required: true },
    stageRuleId: { type: mongoose.Schema.Types.ObjectId, ref: 'StageRule', required: true },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
    round: { type: Number, required: true }, // 1-based: vòng bảng=1, tứ kết=2, bán kết=3, chung kết=4...
    matchNumber: { type: Number, required: true },
    matchType: { type: String, enum: ['group', 'knockout'], required: true },
    sportType: { type: String, required: true },
    ruleId: { type: mongoose.Schema.Types.ObjectId, ref: 'BaseRule', required: true },

    team1: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    team2: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    winnerTeamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    team1Score: { type: Number, default: 0 },
    team2Score: { type: Number, default: 0 },

    courtId: { type: mongoose.Schema.Types.ObjectId, ref: 'Court', default: null },
    scheduledStartTime: { type: Date, required: true },
    actualStartTime: { type: Date, default: null },
    endTime: { type: Date, default: null },
    durationMinutes: { type: Number, default: 90 },

    status: { type: String, enum: ['SCHEDULED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'CANCELED', 'POSTPONED'], default: 'SCHEDULED' },
    refereeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Referee', default: null },
    lineReferees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Referee' }],
}, { timestamps: true });

// Index hỗ trợ truy vấn
matchSchema.index({ tournamentId: 1, matchType: 1, round: 1, matchNumber: 1 });
matchSchema.index({ nextMatchId: 1 });

const Match = mongoose.model("Match", matchSchema);
export default Match;