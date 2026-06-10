import mongoose from "mongoose";

const standingSchema = new mongoose.Schema({
    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament',
        required: true
    },
    tournamentItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TournamentItem',
        required: true   // xếp hạng cho từng môn thi đấu
    },
    teamOrPlayerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'participantType' // có thể là Team hoặc User
    },
    participantType: {
        type: String,
        enum: ['team', 'player'],
        required: true
    },
    bracketid:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bracket'
    },
    stageId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StageRule'
    },

    groupId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'Group'
    },
    // Thống kê chung
    played: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    goalsFor: { type: Number, default: 0 },    // điểm/ bàn thắng
    goalsAgainst: { type: Number, default: 0 },
    goalDifference: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    // Xếp hạng
    rank: { type: Number, default: 0 },
    // Tuỳ chỉnh theo môn thể thao
    customStats: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

// Index để đảm bảo mỗi tournamentItem chỉ có 1 standing cho mỗi đội/người
standingSchema.index({ tournamentItemId: 1, teamOrPlayerId: 1 }, { unique: true });

const Standing = mongoose.model('Standing',standingSchema);
export default Standing;