import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema({
    siteName: { type: String, default: 'ITVTG HUB' },
    siteSlogan: { type: String, default: 'Admin Dashboard' },
    logoUrl: { type: String, default: '' },
    primaryColor: { type: String, default: '#0ea5e9' },
}, { timestamps: true });

export default mongoose.model('SystemSettings', systemSettingsSchema);