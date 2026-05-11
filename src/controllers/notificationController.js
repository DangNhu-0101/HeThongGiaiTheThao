import Notification from '../models/notification.js';

export const getMyNotifications = async (req, res) => {
    try {
        // Lấy ID từ token (đã qua middleware protectedRoute)
        const userId = req.user._id || req.user.id;

        const notifications = await Notification.find({ userId })
            .sort({ createdAt: -1 }) // Thông báo mới nhất hiện lên đầu
            .lean();

        return res.status(200).json({
            success: true,
            data: notifications
        });
    } catch (error) {
        console.error("Lỗi lấy thông báo:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Không thể lấy danh sách thông báo" 
        });
    }
};
export const deleteNotification = async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user._id || req.user.id;
        const notification = await Notification.findOne({ _id: notificationId, userId });
        if (!notification) {
            return res.status(404).json({ 
                success: false,
                message: "Thông báo không tồn tại hoặc bạn không có quyền xóa"
            });
        }
        await Notification.deleteOne({ _id: notificationId });
        return res.status(200).json({
            success: true,
            message: "Thông báo đã được xóa"
        });
    } catch (error) {
        console.error("Lỗi xóa thông báo:", error);
        return res.status(500).json({
            success: false,
            message: "Không thể xóa thông báo"
        });
    }
};