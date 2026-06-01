// stores/useNotificationStore.ts
import { create } from "zustand";
import { toast } from "sonner";
import { notificationService } from "@/services/notificationService";
import type { NotificationState } from "@/types/store";
import type { Notification } from "@/types/notification";  // Import type Notification

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notification: [],
    loading: false,

    getMyNotifications: async () => {
        set({ loading: true });
        try {
            const data = await notificationService.getMyNotifications();
            set({ notification: data, loading: false });
            toast.success("Tải thông báo thành công");
        } catch (error) {
            console.error(error);
            toast.error("Không thể tải thông báo");
            set({ loading: false });
        }
    },

    deleteNotification: async (id: string) => {
        set({ loading: true });
        try {
            await notificationService.deleteNotification(id);

            const updated = get().notification.filter(
                (n: Notification) => n._id !== id
            );
            set({ notification: updated, loading: false });
            toast.success("Xóa thông báo thành công");
        } catch (error) {
            console.error(error);
            toast.error("Xóa thông báo thất bại");
            set({ loading: false });
        }
    },

    clearState: () => {
        set({ notification: [], loading: false });
    },
}));