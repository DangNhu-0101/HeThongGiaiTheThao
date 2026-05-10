import mongoose from "mongoose";

const matchResultSchema = new mongoose.Schema({
    matchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match',
        required: true,
        unique: true
    },

    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament',
        required: true
    },

    winnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'team'
    },

    // KẾT QUẢ
    team1Score: {
        type: Number,
        required: true,
        min: 0
    },

    team2Score: {
        type: Number,
        required: true,
        min: 0
    },

    // BÀN THẮNG BỔNG (Nếu là bóng đá)
    penalties: {
        team1: { type: Number, default: 0 },
        team2: { type: Number, default: 0 }
    },

    // THỐNG KÊ TRẬN ĐẤU
    stats: {
        team1: {
            goals: { type: Number, default: 0 },
            assists: { type: Number, default: 0 },
            fouls: { type: Number, default: 0 },
            cards: {
                yellow: { type: Number, default: 0 },
                red: { type: Number, default: 0 }
            },
            possessionPercentage: { type: Number, default: 0 },
            shotsOnTarget: { type: Number, default: 0 }
        },
        team2: {
            goals: { type: Number, default: 0 },
            assists: { type: Number, default: 0 },
            fouls: { type: Number, default: 0 },
            cards: {
                yellow: { type: Number, default: 0 },
                red: { type: Number, default: 0 }
            },
            possessionPercentage: { type: Number, default: 0 },
            shotsOnTarget: { type: Number, default: 0 }
        }
    },
    // THỜI GIAN
    matchDuration: {
        type: Number, // Tính bằng phút
        default: 0
    },

    startTime: Date,
    endTime: Date,

    // TRẠNG THÁI
    status: {
        type: String,
        enum: ['pending', 'finished', 'cancelled'],
        default: 'pending'
    },

    // NGƯỜI NHẬP LIỆU
    recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

}, {
    timestamps: true
});

// Index
matchResultSchema.index({ matchId: 1 });
matchResultSchema.index({ tournamentId: 1 });
matchResultSchema.index({ createdAt: -1 });

const MatchResult = mongoose.model("MatchResult", matchResultSchema);
export default MatchResult;
