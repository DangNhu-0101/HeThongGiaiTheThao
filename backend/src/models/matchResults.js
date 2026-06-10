// models/MatchResult.js
import mongoose from 'mongoose';

const matchResultSchema = new mongoose.Schema({
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true, unique: true }, // 1-1 với Match
    tournamentItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'TournamentItem', required: true },

    // Kết quả tổng hợp
    winnerParticipantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Participant' },
    winnerScore: { type: Number, default: 0 },      // tổng điểm / bàn thắng của winner
    loserScore: { type: Number, default: 0 },
    isDraw: { type: Boolean, default: false },

    // Kết quả chi tiết theo môn (Mixed)
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },

    // Thống kê mở rộng (tùy môn)
    statistics: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },

    // Lịch sử chỉnh sửa
    history: [{
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        oldResult: { type: mongoose.Schema.Types.Mixed },
        newResult: { type: mongoose.Schema.Types.Mixed },
        reason: { type: String },
        updatedAt: { type: Date, default: Date.now }
    }],

    status: { type: String, enum: ['pending', 'confirmed', 'disputed'], default: 'pending' },
    confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    confirmedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model('MatchResult', matchResultSchema);