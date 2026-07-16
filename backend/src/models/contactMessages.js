import mongoose from 'mongoose';

const contactAttachmentSchema = new mongoose.Schema({
    url: { type: String, required: true, trim: true },
    path: { type: String, default: '', trim: true },
    name: { type: String, default: '', trim: true },
    mimeType: { type: String, default: '', trim: true },
    size: { type: Number, default: 0 }
}, { _id: false });

const contactMessageSchema = new mongoose.Schema({
    fullName: { type: String, required: true, trim: true, maxlength: 160 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 180 },
    phoneNumber: { type: String, default: '', trim: true, maxlength: 40 },
    subject: { type: String, required: true, trim: true, maxlength: 220 },
    content: { type: String, required: true, trim: true, maxlength: 5000 },
    attachments: { type: [contactAttachmentSchema], default: [] },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
    repliedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null, index: true },
    ipAddress: { type: String, default: '', trim: true },
    userAgent: { type: String, default: '', trim: true }
}, { timestamps: true });

contactMessageSchema.index({ createdAt: -1, isRead: 1, deletedAt: 1 });
contactMessageSchema.index({ fullName: 'text', email: 'text', subject: 'text', content: 'text' });

const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);
export default ContactMessage;
