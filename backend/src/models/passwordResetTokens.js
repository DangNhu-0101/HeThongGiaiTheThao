import mongoose from 'mongoose';

const passwordResetTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    codeHash: {
        type: String,
        required: true,
    },
    resetTokenHash: {
        type: String,
        default: '',
        index: true,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true,
    },
    resetTokenExpiresAt: {
        type: Date,
        default: null,
    },
    attempts: {
        type: Number,
        default: 0,
    },
    usedAt: {
        type: Date,
        default: null,
    },
    verifiedAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 });

const PasswordResetToken = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
export default PasswordResetToken;
