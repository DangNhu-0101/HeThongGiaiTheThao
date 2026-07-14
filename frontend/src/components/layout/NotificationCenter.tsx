import { useState } from "react";
import { Bell, Check, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTeamCollaborationStore } from "@/stores/useTeamCollaborationStore";

const NotificationCenter = () => {
  const [open, setOpen] = useState(false);
  const { notifications, acceptInvitation, rejectInvitation, markRead } = useTeamCollaborationStore();
  const unread = notifications.filter((item) => !item.read).length;

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((current) => !current)} className="relative rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white">
        <Bell className="h-5 w-5" />
        {unread > 0 && <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white">{unread}</span>}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(380px,90vw)] overflow-hidden rounded-lg border border-border bg-card text-foreground shadow-[var(--shadow-panel)]">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div><p className="font-black">Thông báo</p><p className="text-xs text-muted-foreground">{unread} thông báo chưa đọc</p></div>
          </div>
          <div className="max-h-[480px] overflow-y-auto">
            {notifications.map((notice) => (
              <div key={notice.id} className={`border-b border-border p-4 last:border-0 ${notice.read ? "bg-card" : "bg-primary/5"}`}>
                <div className="flex items-start gap-3">
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${notice.read ? "bg-muted" : "bg-primary"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{notice.title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{notice.message}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {notice.actionKind === "invitation" && notice.actionId && !notice.read && (
                        <>
                          <Button size="sm" onClick={() => void acceptInvitation(notice.actionId!)}><Check className="mr-1 h-3.5 w-3.5" />Nhận lời</Button>
                          <Button size="sm" variant="outline" onClick={() => void rejectInvitation(notice.actionId!)}><X className="mr-1 h-3.5 w-3.5" />Từ chối</Button>
                        </>
                      )}
                      {notice.href && <Button size="sm" variant="ghost" render={<Link to={notice.href} onClick={() => { markRead(notice.id); setOpen(false); }} />}>Xem chi tiết</Button>}
                      {!notice.read && <Button size="sm" variant="ghost" onClick={() => markRead(notice.id)}>Đánh dấu đã đọc</Button>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {notifications.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Chưa có thông báo.</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
