import mongoose from 'mongoose';

const knockoutResultSchema = new mongoose.Schema({
  tournamentItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'TournamentItem', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bracket', default: null },
  branchKey: { type: String, required: true },
  branchName: { type: String, default: '' },
  finalMatchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
  finalStageId: { type: mongoose.Schema.Types.ObjectId, ref: 'StageRule', required: true },
  championParticipantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Participant', required: true },
  runnerUpParticipantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Participant', required: true },
  finalScore: {
    teamA: { type: Number, default: 0 },
    teamB: { type: Number, default: 0 },
  },
  determinedAt: { type: Date, default: Date.now },
}, { timestamps: true });

knockoutResultSchema.index({ tournamentItemId: 1, finalMatchId: 1 }, { unique: true });
knockoutResultSchema.index({ tournamentItemId: 1, branchKey: 1, finalMatchId: 1 }, { unique: true });

export default mongoose.model('KnockoutResult', knockoutResultSchema);
