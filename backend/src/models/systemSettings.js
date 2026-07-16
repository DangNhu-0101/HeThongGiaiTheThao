import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema({
    key: {
        type: String,
        default: 'public',
        unique: true
    },
    siteName: {
        type: String,
        default: 'TMS',
        trim: true,
        maxlength: 120
    },
    logoUrl: {
        type: String,
        default: '',
        trim: true
    },
    contactAddress: {
        type: String,
        default: '',
        trim: true,
        maxlength: 500
    },
    supportEmail: {
        type: String,
        default: '',
        trim: true,
        lowercase: true
    },
    contactPhone: {
        type: String,
        default: '',
        trim: true,
        maxlength: 40
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, { timestamps: true });

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);
export default SystemSettings;
