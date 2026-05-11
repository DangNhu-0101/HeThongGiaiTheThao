import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['INVITATION', 'PAYMENT', 'SYSTEM', 'MATCH'],
        default: 'SYSTEM'
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    // Metadata dùng để lưu các thông tin linh hoạt như teamId, amount, QR code...
    metadata: {
        teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
        tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament' },
        amount: { type: Number },
        paymentQR: { type: String },
        paymentContent: { type: String },
        invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

export default Notification;