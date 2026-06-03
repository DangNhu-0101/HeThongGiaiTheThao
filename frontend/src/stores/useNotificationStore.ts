// stores/useNotificationStore.ts
import { create } from "zustand";
import { toast } from "sonner";
import { notificationService } from "@/services/notificationService";
import type { NotificationState } from "@/types/store";
import type { Notification } from "@/types/notification";  // Import type Notification

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    loading: false,

    fetchNotifications: async () => {
        set({ loading: true });
        try {
            const data = await notificationService.getMyNotifications();
            const unreadCount = data.filter((n: Notification) => !n.isRead).length;
            set({ notifications: data || [], unreadCount, loading: false });
        } catch (error) {
            console.error(error);
            set({ loading: false });
        }
    },

    getMyNotifications: async () => {
        set({ loading: true });
        try {
            const data = await notificationService.getMyNotifications();
            const unreadCount = data.filter((n: Notification) => !n.isRead).length;
            set({ notifications: data || [], unreadCount, loading: false });
            toast.success("Tải thông báo thành công");
        } catch (error) {
            console.error(error);
            toast.error("Không thể tải thông báo");
            set({ loading: false });
        }
    },

    markAsRead: async (id: string) => {
        try {
            // Giả sử có API cho markAsRead, tạm thời cập nhật UI
            const { notifications } = get();
            const updated = notifications.map((n: Notification) => n._id === id ? { ...n, isRead: true } : n);
            const unreadCount = updated.filter((n: Notification) => !n.isRead).length;
            set({ notifications: updated, unreadCount });
        } catch (error) {
            console.error(error);
        }
    },

    markAllAsRead: async () => {
        try {
            const { notifications } = get();
            const updated = notifications.map((n: Notification) => ({ ...n, isRead: true }));
            set({ notifications: updated, unreadCount: 0 });
        } catch (error) {
            console.error(error);
        }
    },

    deleteNotification: async (id: string) => {
        set({ loading: true });
        try {
            await notificationService.deleteNotification(id);

            const updated = get().notifications.filter(
                (n: Notification) => n._id !== id
            );
            const unreadCount = updated.filter((n: Notification) => !n.isRead).length;
            set({ notifications: updated, unreadCount, loading: false });
            toast.success("Xóa thông báo thành công");
        } catch (error) {
            console.error(error);
            toast.error("Xóa thông báo thất bại");
            set({ loading: false });
        }
    },

    clearState: () => {
        set({ notifications: [], unreadCount: 0, loading: false });
    },
}));