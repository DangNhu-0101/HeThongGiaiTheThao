import mongoose from "mongoose";
import User from "./user.js";
import Team from "./team.js";


const invitationSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: User,
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: User,
        required: true
    },

    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: Team,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'expired'],
        default: 'pending'
    },

    message: {
        type: String,
        trim: true,
        maxLength: 200
    }
},
    {
        timestamps: true
    }
);

const Invitation = mongoose.model('invitation', invitationSchema);
export default Invitation;
