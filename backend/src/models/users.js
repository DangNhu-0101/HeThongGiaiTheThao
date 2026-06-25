
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
    hashedPassword: {
        type: String,
        required: true
    },
    roles: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role"
    }],
    avatar: { type: String, default: '' },
    status: {
        type: String,
        enum: ['actived', 'inactive', 'banned'],
        default: 'actived'
    },
    // ========== BỔ SUNG CHO YÊU CẦU ROLE ==========
    requestedRole: {
        type: String,
        enum: ['org', 'referee', null],
        default: null
    },
    roleRequestStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', null],
        default: null
    },
    requestedProfile: {
        type: mongoose.Schema.Types.Mixed, // lưu dữ liệu profile tạm thời
        default: null
    },
    roleRequestedAt: {
        type: Date,
        default: null
    },
    roleReviewedAt: {
        type: Date,
        default: null
    },
    roleReviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, { timestamps: true });

// Index cho tìm kiếm
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ phoneNumber: 1 });
userSchema.index({ roleRequestStatus: 1 });

const User = mongoose.model('User', userSchema);
export default User;