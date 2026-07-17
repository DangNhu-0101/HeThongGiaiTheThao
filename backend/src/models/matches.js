import mongoose from "mongoose";
import { MATCH_STATUS_VALUES } from '../config/matchStatusTags.js';

const matchSchema = new mongoose.Schema({
    // Thông tin cơ bản
    tournamentItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'TournamentItem', required: true },
    stageId: { type: mongoose.Schema.Types.ObjectId, ref: 'StageRule', required: true },
    bracketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bracket' },
    groupId:{type: mongoose.Schema.Types.ObjectId, ref: 'Group'},

    name: { type: String, required: true },
    round: { type: Number, required: true }, // Số thứ tự vòng đấu (1, 2, 3...)
    previousMatches: [{
        matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
        position: { type: String, enum: ['WINNER', 'LOSER'], default: 'WINNER' }, // Vị trí vào trận này từ thắng hay thua?
    }],

    // Các tham chiếu đến trận đấu tiếp theo (quan trọng nhất)
    nextMatchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', default: null }, // Người thắng sẽ đi tiếp vào trận nào?
    nextLoserMatchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', default: null }, // Người thua sẽ rơi vào trận nào? (Chỉ dùng cho nhánh thua)

    // Các đối thủ của trận đấu
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Participant' }],
    formatNodeId: { type: String, default: '' },
    formatStageId: { type: String, default: '' },
    formatSlotLabels: [{ type: String }],
    slotSources: [{
        slotIndex: { type: Number, required: true },
        sourceType: {
            type: String,
            enum: ['groupRank', 'winnerOfMatch', 'loserOfMatch', 'manual'],
            default: 'manual'
        },
        sourceMatchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', default: null },
        sourceMatchCode: { type: String, default: '' },
        sourceStageId: { type: mongoose.Schema.Types.ObjectId, ref: 'StageRule', default: null },
        sourceBranchKey: { type: String, default: '' },
        sourceKey: { type: String, default: '' },
    }],
    matchResultId: { type: mongoose.Schema.Types.ObjectId, ref: 'MatchResult', default: null },

    // Trạng thái
    status: { type: String, enum: MATCH_STATUS_VALUES, default: 'pending' },
    scheduledTime: { type: Date },
    durationMinutes: { type: Number, min: 1 },
    courtId: { type: mongoose.Schema.Types.ObjectId, ref: 'Court' },
    refereeIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TournamentReferee' }],
    scheduleOrder: { type: Number, default: 0 },
    scheduleStatus: { type: String, enum: ['draft', 'published'], default: 'draft' },

    // Kết quả tổng hợp cuối cùng
    winnerParticipantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Participant', default: null },
}, { timestamps: true });

const Match = mongoose.model('Match',matchSchema);
export default Match;
