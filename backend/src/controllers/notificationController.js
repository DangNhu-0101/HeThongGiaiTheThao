import Notification from '../models/notifications.js';

const mapNotification = (item) => ({
    id: item._id.toString(),
    title: item.title,
    message: item.message,
    type: item.type,
    href: item.href || undefined,
    actionKind: item.actionKind || undefined,
    actionId: item.actionId || undefined,
    read: Boolean(item.isRead),
    isRead: Boolean(item.isRead),
    createdAt: item.createdAt,
    readAt: item.readAt
});

export const listNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user._id, deletedAt: null })
            .sort({ createdAt: -1 })
            .limit(80)
            .lean();
        return res.json({
            success: true,
            data: notifications.map(mapNotification),
            unread: notifications.filter(item => !item.isRead).length
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const markNotificationRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id, deletedAt: null },
            { $set: { isRead: true, readAt: new Date() } },
            { returnDocument: 'after' }
        );
        if (!notification) return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo' });
        return res.json({ success: true, data: mapNotification(notification) });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const markAllNotificationsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user._id, deletedAt: null, isRead: false },
            { $set: { isRead: true, readAt: new Date() } }
        );
        return res.json({ success: true, message: 'Đã đánh dấu tất cả thông báo là đã đọc' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id, deletedAt: null },
            { $set: { deletedAt: new Date(), isRead: true, readAt: new Date() } },
            { returnDocument: 'after' }
        );
        if (!notification) return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo' });
        return res.json({ success: true, message: 'Đã xóa thông báo' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteAllNotifications = async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user._id, deletedAt: null },
            { $set: { deletedAt: new Date(), isRead: true, readAt: new Date() } }
        );
        return res.json({ success: true, message: 'Đã xóa tất cả thông báo' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
