import mongoose from 'mongoose';

const teamJoinRequestSchema = new mongoose.Schema({
    participantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Participant',
        required: true
    },
    tournamentItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TournamentItem',
        required: true
    },
    requesterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    requesterPlayerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player',
        required: true
    },
    message: {
        type: String,
        trim: true,
        maxLength: 200,
        default: ''
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'cancelled'],
        default: 'pending'
    }
}, { timestamps: true });

teamJoinRequestSchema.index({ participantId: 1, requesterId: 1, status: 1 });
teamJoinRequestSchema.index({ requesterId: 1, status: 1 });

const TeamJoinRequest = mongoose.models.TeamJoinRequest || mongoose.model('TeamJoinRequest', teamJoinRequestSchema);
export default TeamJoinRequest;
