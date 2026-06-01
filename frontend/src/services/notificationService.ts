import api from "../libs/axios";
import type { Notification } from "@/types/notification";


export const notificationService = {
    getMyNotifications: async (): Promise<Notification[]> => {
        try {
            const res = await api.get("/notifications/my");
            // Giả sử API trả về { success: true, data: notifications }
            return res.data?.data || [];
        } catch (err) {
            console.error("Lỗi lấy thông báo:", err);
            throw new Error("Không thể lấy danh sách thông báo", { 
                cause: err 
            });
        }
    },

    // Xóa một thông báo
    deleteNotification: async (notificationId: string): Promise<void> => {
        try {
            await api.delete(`/notifications/${notificationId}`);
        } catch (err) {
            console.error("Lỗi xóa thông báo:", err);
            throw new Error("Không thể xóa thông báo", { 
                cause: err
            });
        }
    },
}