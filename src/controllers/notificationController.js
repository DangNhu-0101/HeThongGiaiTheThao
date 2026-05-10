export const getMyNotifications = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id; // Đảm bảo lấy đúng ID từ Middleware
        
        const notifications = await Notification.find({ userId })
            .sort({ createdAt: -1 }) // Thông báo mới nhất lên đầu
            .lean();

        return res.status(200).json({
            success: true,
            data: notifications
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};