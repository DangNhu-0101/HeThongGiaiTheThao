import mongoose from "mongoose";


const matchSchema = new mongoose.Schema({
    tournamentId: { type: mongoose.Schema.Types.ObjectId, 
        ref: 'Tournament', 
        required: true, 
        index: true 
    },
    bracketId: { type: mongoose.Schema.Types.ObjectId, 
        ref: 'Bracket', 
        required: true 
    },
    stageRuleId: { type: mongoose.Schema.Types.ObjectId,
         ref: 'StageRule', 
         required: true 
    },
    groupId: { type: mongoose.Schema.Types.ObjectId,
        ref: 'Group', 
        default: null 
    },
    round: { type: Number, 
        required: true 
    }, // thay vì ObjectId ref 'Round'
    roundName: { type: String, default: '' },
    matchName: { type: String, default: '' },
    substageName: { type: String, default: '' },
    parentSubstageId: { type: mongoose.Schema.Types.Mixed, default: null },
    matchNumber: { type: Number, required: true },
    matchType: { type: String, 
        enum: ['group', 'knockout'], 
        required: true 
    },
    sportType: { type: String, 
        required: true 
    },
    ruleId: { type: mongoose.Schema.Types.ObjectId, 
        ref: 'BaseRule', 
        required: true 
    }, // bỏ refPath, chỉ dùng BaseRule

    team1: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    team2: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    team1Name: { type: String, default: '' },
    team2Name: { type: String, default: '' },
    team1SlotCode: { type: String, default: '' },
    team2SlotCode: { type: String, default: '' },
    winnerTeamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    winnerPlaceholderName: { type: String, default: '' },
    slotCode: { type: String, default: '' },
    winnerTarget: { type: String, default: '' },
    loserTarget: { type: String, default: '' },
    nextMatchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', default: null },
    nextMatchNumber: { type: Number, default: null },
    nextMatchSide: { type: Number, enum: [1, 2, null], default: null },
    team1Score: { type: Number, default: 0 },
    team2Score: { type: Number, default: 0 },

    courtId: { type: mongoose.Schema.Types.ObjectId, 
        ref: 'Court', 
        default: null 
    },
    courtName: { type: String, default: '' },
    scheduledStartTime: { type: Date, default: null },
    actualStartTime: { type: Date, default: null },
    endTime: { type: Date, 
        default: null 
    },
    durationMinutes: { type: Number, 
        default: 90 
    }, // thêm duration

    status: { type: String, 
        enum: ['SCHEDULED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'CANCELED', 'POSTPONED'], 
        default: 'SCHEDULED' 
    },
    refereeId: { type: mongoose.Schema.Types.ObjectId, 
        ref: 'Referee', 
        default: null 
    },
    lineReferees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Refeere' }],
    isPublished: { type: Boolean, default: false },
}, { timestamps: true });

const Match = mongoose.model("Match", matchSchema);
export default Match;
