import SystemSettings from '../models/systemSettings.js';

const DEFAULT_SETTINGS = {
    siteName: 'TMS',
    logoUrl: '',
    contactAddress: 'Supply Base - POVO',
    supportEmail: '',
    contactPhone: ''
};

const isEmail = (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
const isPhone = (value) => !value || /^[0-9+\-\s().]{7,24}$/.test(String(value));

const getOrCreateSettings = async () => {
    const settings = await SystemSettings.findOneAndUpdate(
        { key: 'public' },
        { $setOnInsert: { key: 'public', ...DEFAULT_SETTINGS } },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    ).lean();
    return settings;
};

const mapSettings = (settings) => ({
    siteName: settings.siteName || DEFAULT_SETTINGS.siteName,
    logoUrl: settings.logoUrl || DEFAULT_SETTINGS.logoUrl,
    contactAddress: settings.contactAddress || DEFAULT_SETTINGS.contactAddress,
    supportEmail: settings.supportEmail || DEFAULT_SETTINGS.supportEmail,
    contactPhone: settings.contactPhone || DEFAULT_SETTINGS.contactPhone,
    updatedAt: settings.updatedAt
});

export const getPublicSettings = async (_req, res) => {
    try {
        const settings = await getOrCreateSettings();
        return res.json({ success: true, data: mapSettings(settings) });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateSystemSettings = async (req, res) => {
    try {
        const { siteName, logoUrl, contactAddress, supportEmail, contactPhone } = req.body;
        if (supportEmail !== undefined && !isEmail(supportEmail)) {
            return res.status(400).json({ success: false, message: 'Email hỗ trợ không hợp lệ' });
        }
        if (contactPhone !== undefined && !isPhone(contactPhone)) {
            return res.status(400).json({ success: false, message: 'Số điện thoại liên hệ không hợp lệ' });
        }

        const update = {};
        if (siteName !== undefined) update.siteName = String(siteName).trim().slice(0, 120);
        if (logoUrl !== undefined) update.logoUrl = String(logoUrl).trim();
        if (contactAddress !== undefined) update.contactAddress = String(contactAddress).trim().slice(0, 500);
        if (supportEmail !== undefined) update.supportEmail = String(supportEmail).trim().toLowerCase();
        if (contactPhone !== undefined) update.contactPhone = String(contactPhone).trim();
        update.updatedBy = req.user._id;

        const settings = await SystemSettings.findOneAndUpdate(
            { key: 'public' },
            { $set: update, $setOnInsert: { key: 'public' } },
            { upsert: true, returnDocument: 'after', runValidators: true }
        ).lean();

        return res.json({ success: true, message: 'Đã cập nhật cài đặt hệ thống', data: mapSettings(settings) });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
