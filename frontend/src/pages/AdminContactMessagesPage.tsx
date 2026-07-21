import { useCallback, useEffect, useState } from "react";
import { Eye, Mail, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { contactMessageService, type ContactMessage } from "@/services/contactMessageService";

const AdminContactMessagesPage = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [search, setSearch] = useState("");
  const [read, setRead] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await contactMessageService.list({ page, limit: 10, search, read });
      setMessages(result.data);
      setTotalPages(Math.max(1, result.totalPages));
    } catch {
      setError("Không thể tải tin nhắn liên hệ.");
    } finally {
      setLoading(false);
    }
  }, [page, read, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchData(), 250);
    return () => window.clearTimeout(timer);
  }, [fetchData]);

  const toggleRead = async (item: ContactMessage, isRead = !item.isRead) => {
    const previous = messages;
    setMessages((items) => items.map((message) => message.id === item.id ? { ...message, isRead } : message));
    try {
      await contactMessageService.update(item.id, { isRead });
    } catch {
      setMessages(previous);
      toast.error("Không thể cập nhật trạng thái tin nhắn.");
    }
  };

  const remove = async (item: ContactMessage) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa tin nhắn này?")) return;
    const previous = messages;
    setMessages((items) => items.filter((message) => message.id !== item.id));
    try {
      await contactMessageService.remove(item.id);
      toast.success("Đã xóa tin nhắn.");
    } catch {
      setMessages(previous);
      toast.error("Không thể xóa tin nhắn.");
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-12">
      <section className="rounded-2xl bg-header p-6 text-white shadow-lg">
        <p className="text-[10px] font-bold uppercase text-white/70">Quản trị hệ thống</p>
        <h1 className="mt-1 text-3xl font-bold uppercase tracking-normal">Tin nhắn liên hệ</h1>
        <p className="mt-2 text-sm text-white/72">Theo dõi, lọc và phản hồi tin nhắn được gửi từ trang liên hệ công khai.</p>
      </section>

      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 shadow-sm md:grid-cols-[1fr_180px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder="Tìm theo tên, email, tiêu đề hoặc nội dung..." />
        </div>
        <select value={read} onChange={(event) => { setPage(1); setRead(event.target.value); }} className="h-10 rounded-lg border border-input bg-card px-3 text-sm">
          <option value="">Tất cả trạng thái</option>
          <option value="false">Chưa đọc</option>
          <option value="true">Đã đọc</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {loading ? (
          <p className="p-10 text-center text-sm text-muted-foreground">Đang tải tin nhắn...</p>
        ) : error ? (
          <div className="p-10 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button className="mt-3" onClick={() => void fetchData()}>Thử lại</Button>
          </div>
        ) : messages.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">Chưa có tin nhắn liên hệ phù hợp.</p>
        ) : (
          <div className="divide-y divide-border">
            {messages.map((item) => (
              <article key={item.id} className={`grid gap-3 p-4 md:grid-cols-[1fr_auto] ${item.isRead ? "bg-card" : "bg-primary/5"}`}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate font-bold text-foreground">{item.subject}</h2>
                    {!item.isRead && <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">Mới</span>}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{item.fullName} · {item.email} · {new Date(item.createdAt).toLocaleString("vi-VN")}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.content}</p>
                </div>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  <Button size="sm" variant="outline" onClick={() => { setSelected(item); void toggleRead(item, true); }}><Eye className="h-4 w-4" /> Xem</Button>
                  <Button size="sm" variant="outline" render={<a href={`mailto:${item.email}?subject=${encodeURIComponent(`Phản hồi: ${item.subject}`)}`} />}><Mail className="h-4 w-4" /> Phản hồi</Button>
                  <Button size="sm" variant="outline" onClick={() => void toggleRead(item)}>{item.isRead ? "Đánh dấu chưa đọc" : "Đánh dấu đã đọc"}</Button>
                  <Button size="sm" variant="destructive" onClick={() => void remove(item)}><Trash2 className="size-4 text-white/80" /><span className="text-white/80"> Xóa</span></Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Trước</Button>
        <span className="text-sm text-muted-foreground">Trang {page}/{totalPages}</span>
        <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Sau</Button>
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selected?.subject}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <p><strong>Người gửi:</strong> {selected.fullName}</p>
                <p><strong>Email:</strong> {selected.email}</p>
                {selected.phoneNumber && <p><strong>Số điện thoại:</strong> {selected.phoneNumber}</p>}
                <p><strong>Ngày gửi:</strong> {new Date(selected.createdAt).toLocaleString("vi-VN")}</p>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-7">{selected.content}</p>
              {selected.attachments.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {selected.attachments.map((attachment) => (
                    <a key={attachment.url} href={attachment.url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-lg border border-border">
                      <img src={attachment.url} alt={attachment.name || "Ảnh đính kèm"} className="h-40 w-full object-cover" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminContactMessagesPage;
