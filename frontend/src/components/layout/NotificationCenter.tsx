import { useEffect, useState } from "react";
import { Bell, Check, CheckCheck, Trash2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { notificationService } from "@/services/notificationService";
import { useTeamCollaborationStore } from "@/stores/useTeamCollaborationStore";
import type { TeamNotification } from "@/types/teamCollaboration";

type NotificationCenterProps = {
  variant?: "public" | "dashboard";
};

const NotificationCenter = ({ variant = "public" }: NotificationCenterProps) => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<TeamNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const { acceptInvitation, rejectInvitation } = useTeamCollaborationStore();
  const unread = notifications.filter((item) => !item.read).length;

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      setNotifications(await notificationService.list());
    } catch (error) {
      console.error("Không thể tải thông báo:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      void fetchNotifications();
    });
  }, []);

  const markRead = async (id: string) => {
    const previous = notifications;
    setNotifications((items) => items.map((item) => (item.id === id ? { ...item, read: true } : item)));
    try {
      await notificationService.markRead(id);
    } catch {
      setNotifications(previous);
      toast.error("Không thể đánh dấu thông báo đã đọc.");
    }
  };

  const markAllRead = async () => {
    const previous = notifications;
    setNotifications((items) => items.map((item) => ({ ...item, read: true })));
    try {
      await notificationService.markAllRead();
    } catch {
      setNotifications(previous);
      toast.error("Không thể đánh dấu tất cả thông báo.");
    }
  };

  const remove = async (id: string) => {
    const previous = notifications;
    setNotifications((items) => items.filter((item) => item.id !== id));
    try {
      await notificationService.remove(id);
    } catch {
      setNotifications(previous);
      toast.error("Không thể xóa thông báo.");
    }
  };

  const removeAll = async () => {
    if (!window.confirm("Bạn chắc chắn muốn xóa tất cả thông báo?")) return;
    const previous = notifications;
    setNotifications([]);
    try {
      await notificationService.removeAll();
    } catch {
      setNotifications(previous);
      toast.error("Không thể xóa tất cả thông báo.");
    }
  };

  const buttonClass =
    variant === "dashboard"
      ? "relative inline-flex size-10 items-center justify-center rounded-xl border border-primary/30 bg-white text-primary-dark shadow-sm transition-colors hover:bg-primary-light/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      : "relative inline-flex size-10 items-center justify-center rounded-xl border border-primary/25 bg-white text-primary-dark shadow-sm transition-colors hover:bg-primary-light/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((current) => !current)} className={buttonClass} aria-label="Mở thông báo">
        <Bell className="h-5 w-5" />
        {unread > 0 && <span className="absolute right-2 top-2 size-2.5 rounded-full border-2 border-white bg-accent" />}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(420px,92vw)] overflow-hidden rounded-lg border border-border bg-card text-foreground shadow-[var(--shadow-panel)]">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div>
              <p className="font-bold">Thông báo</p>
              <p className="text-xs text-muted-foreground">{unread} thông báo chưa đọc</p>
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={markAllRead} disabled={!notifications.length} aria-label="Đánh dấu tất cả đã đọc">
                <CheckCheck className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={removeAll} disabled={!notifications.length} aria-label="Xóa tất cả thông báo">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="max-h-[480px] overflow-y-auto">
            {loading && <p className="p-8 text-center text-sm text-muted-foreground">Đang tải thông báo...</p>}
            {!loading &&
              notifications.map((notice) => (
                <div key={notice.id} className={`border-b border-border p-4 last:border-0 ${notice.read ? "bg-card" : "bg-primary/5"}`}>
                  <div className="flex items-start gap-3">
                    <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${notice.read ? "bg-muted" : "bg-accent"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold">{notice.title}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{notice.message}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {notice.actionKind === "invitation" && notice.actionId && !notice.read && (
                          <>
                            <Button size="sm" onClick={() => void acceptInvitation(notice.actionId!)}>
                              <Check className="mr-1 h-3.5 w-3.5" />Nhận lời
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => void rejectInvitation(notice.actionId!)}>
                              <X className="mr-1 h-3.5 w-3.5" />Từ chối
                            </Button>
                          </>
                        )}
                        {notice.href && (
                          <Button size="sm" variant="ghost" render={<Link to={notice.href} onClick={() => { void markRead(notice.id); setOpen(false); }} />}>
                            Xem chi tiết
                          </Button>
                        )}
                        {!notice.read && (
                          <Button size="sm" variant="ghost" onClick={() => void markRead(notice.id)}>
                            Đánh dấu đã đọc
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => void remove(notice.id)}>
                          Xóa
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            {!loading && notifications.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Chưa có thông báo.</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
