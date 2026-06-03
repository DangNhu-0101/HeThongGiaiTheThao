import SystemSettings from '../models/systemSettings.js';

export const getSettings = async (req, res) => {
    try {
        let settings = await SystemSettings.findOne();
        if (!settings) {
            settings = await SystemSettings.create({});
        }
        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateSettings = async (req, res) => {
    try {
        const { siteName, siteSlogan, primaryColor } = req.body;
        const updateData = { siteName, siteSlogan, primaryColor };
        
        // Nếu có upload file logo mới qua multer
        if (req.file) {
            updateData.logoUrl = req.file.path.replace(/\\/g, '/');
        }

        const settings = await SystemSettings.findOneAndUpdate({}, updateData, { new: true, upsert: true });
        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};