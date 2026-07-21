import mongoose from 'mongoose';

const teamAchievementSchema = new mongoose.Schema({
    tournamentItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'TournamentItem', required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bracket', default: null },
    branchKey: { type: String, required: true },
    branchName: { type: String, default: '' },
    finalMatchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
    finalStageId: { type: mongoose.Schema.Types.ObjectId, ref: 'StageRule', required: true },
    participantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Participant', required: true },
    achievementType: {
        type: String,
        enum: ['champion', 'runner-up', 'third-place'],
        required: true,
    },
    title: { type: String, required: true },
    finalScore: {
        teamA: { type: Number, default: 0 },
        teamB: { type: Number, default: 0 },
    },
    achievedAt: { type: Date, default: Date.now },
    source: { type: String, enum: ['knockout-final'], default: 'knockout-final' },
}, { timestamps: true });

teamAchievementSchema.index({ tournamentItemId: 1, finalMatchId: 1, achievementType: 1 }, { unique: true });
teamAchievementSchema.index({ tournamentItemId: 1, branchKey: 1, participantId: 1, achievementType: 1 }, { unique: true });
teamAchievementSchema.index({ participantId: 1, achievedAt: -1 });

export default mongoose.model('TeamAchievement', teamAchievementSchema);
