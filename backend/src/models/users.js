import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: { 
        type: String,
        required: true, 
        unique: true 
    },

    email: { 
        type: String, 
        required: true, 
        unique: true 
    },

    phoneNumber: {
        type: String, 
        required: true,
        unique: true 
    },
    hashedPassword: { type: String, 
        required: true 
    },

    roles: [{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role" 
    }],
    requestedRole: {
        type: String,
        enum: ['org', 'referee', null],
        default: null
    },
    roleRequestStatus: {
        type: String,
        enum: ['none', 'pending', 'approved', 'rejected'],
        default: 'none'
    },
    requestedProfile: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    roleReviewedAt: { type: Date, default: null },
    roleReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    avatar: { type: String },

    status: {
        type: String,
        enum: ['actived', 'inactive', 'banned'],
        default: 'actived'
    }
}
, { timestamps: true });

const User = mongoose.model('User', userSchema);

export default User;
