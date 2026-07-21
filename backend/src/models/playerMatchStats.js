import mongoose from 'mongoose';

const playerMatchStatSchema = new mongoose.Schema({
    playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
    participantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Participant', required: true },
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
    tournamentItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'TournamentItem', required: true },
    result: { type: String, enum: ['win', 'loss', 'draw'], required: true },
    played: { type: Number, default: 1 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    countedAt: { type: Date, default: Date.now },
}, { timestamps: true });

playerMatchStatSchema.index({ playerId: 1, matchId: 1 }, { unique: true });
playerMatchStatSchema.index({ participantId: 1, matchId: 1 });
playerMatchStatSchema.index({ playerId: 1, tournamentItemId: 1 });

export default mongoose.model('PlayerMatchStat', playerMatchStatSchema);
