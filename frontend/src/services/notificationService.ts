import api from "@/libs/axios";
import type { TeamNotification } from "@/types/teamCollaboration";

const mapNotification = (item: Record<string, unknown>): TeamNotification => ({
  id: String(item.id || item._id || ""),
  type: String(item.type || "system") as TeamNotification["type"],
  title: String(item.title || "Thông báo"),
  message: String(item.message || ""),
  href: item.href ? String(item.href) : undefined,
  read: Boolean(item.read ?? item.isRead),
  createdAt: String(item.createdAt || new Date().toISOString()),
  actionKind: item.actionKind ? String(item.actionKind) as TeamNotification["actionKind"] : undefined,
  actionId: item.actionId ? String(item.actionId) : undefined,
});

export const notificationService = {
  async list() {
    const response = await api.get<{ data: Record<string, unknown>[] }>("/notifications");
    return response.data.data.map(mapNotification);
  },
  async markRead(id: string) {
    await api.patch(`/notifications/${id}/read`);
  },
  async markAllRead() {
    await api.patch("/notifications/read-all");
  },
  async remove(id: string) {
    await api.delete(`/notifications/${id}`);
  },
  async removeAll() {
    await api.delete("/notifications/all");
  },
};
