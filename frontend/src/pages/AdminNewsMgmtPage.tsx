import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit3, Loader2, Newspaper, Plus, RefreshCw, Save, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { RichTextRenderer } from "@/components/ui/rich-text-renderer";
import { newsService, type NewsRecord } from "@/services/newsService";
import { excerptOf, formatNewsDate } from "@/utils/newsDisplay";
import NewsImage from "@/components/news/NewsImage";

const emptyDraft: Partial<NewsRecord> = {
  title: "",
  excerpt: "",
  content: "",
  coverImage: "",
  category: "Tin tức",
  topic: "Tin tức",
  status: "published",
};

const AdminNewsMgmtPage = () => {
  const [records, setRecords] = useState<NewsRecord[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Partial<NewsRecord> | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [news, topicList] = await Promise.all([
        newsService.adminList({ status: "all", limit: 100 }),
        newsService.topics(),
      ]);
      setRecords(news);
      setTopics(topicList);
    } catch (requestError) {
      console.error("Không thể tải dữ liệu tin tức:", requestError);
      setError("Không thể tải dữ liệu tin tức. Vui lòng thử lại.");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void fetchData(), 0);
    return () => window.clearTimeout(timeout);
  }, [fetchData]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return records;
    return records.filter((item) => `${item.title} ${item.topic} ${item.status}`.toLowerCase().includes(keyword));
  }, [records, search]);

  const submit = async () => {
    if (!editing?.title?.trim()) return;
    setSaving(true);
    try {
      const payload = { ...editing, topic: editing.topic || editing.category || "Tin tức" };
      if (editing._id) await newsService.update(editing._id, payload);
      else await newsService.create(payload);
      setEditing(null);
      await fetchData();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string, title: string) => {
    if (!window.confirm(`Xóa bài viết "${title}"?`)) return;
    await newsService.remove(id);
    await fetchData();
  };

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-6 pb-12">
      <section className="rounded-2xl bg-header p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase text-white/60">Quản trị hệ thống</p>
            <h1 className="mt-1 text-3xl font-extrabold uppercase tracking-normal">Quản lý tin tức</h1>
            <p className="mt-2 text-sm text-white/70">Tạo, chỉnh sửa, phân loại chủ đề và công bố bài viết rich text.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-white text-foreground hover:bg-white/90" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Tải lại
            </Button>
            <Button onClick={() => setEditing(emptyDraft)}>
              <Plus className="size-4" /> Tạo bài viết
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tiêu đề, chủ đề, trạng thái" className="pl-10" />
          </div>
          <span className="text-sm font-semibold text-muted-foreground">{filtered.length} bài viết</span>
        </div>

        {loading ? (
          <div className="p-10 text-center text-muted-foreground">
            <Loader2 className="mx-auto mb-3 size-6 animate-spin text-primary" /> Đang tải tin tức...
          </div>
        ) : error ? (
          <div className="p-10 text-center text-red-700">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <Newspaper className="mx-auto mb-3 size-10 text-primary" />
            Chưa có bài viết phù hợp.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((item) => (
              <article key={item._id} className="grid gap-4 p-4 md:grid-cols-[12rem_1fr_auto] md:items-center">
                <NewsImage src={item.coverImage} alt={item.title} className="aspect-[16/10] w-full rounded-xl object-cover md:w-48" />
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap gap-2 text-xs font-bold">
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-secondary-foreground">{item.topic || "Tin tức"}</span>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">{item.status}</span>
                    <span className="px-2.5 py-1 text-muted-foreground">{formatNewsDate(item.publishedAt || item.createdAt)}</span>
                  </div>
                  <h2 className="line-clamp-1 text-lg font-bold text-foreground">{item.title}</h2>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{excerptOf(item)}</p>
                </div>
                <div className="flex gap-2 md:justify-end">
                  <Button size="sm" variant="outline" onClick={() => setEditing(item)}><Edit3 className="size-4" /> Sửa</Button>
                  <Button size="sm" variant="destructive" onClick={() => void remove(item._id, item.title)}><Trash2 className="size-4" /> Xóa</Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {editing && (
        <div className="fixed inset-0 z-[80] overflow-y-auto bg-slate-950/55 p-4">
          <div className="mx-auto my-8 max-w-5xl rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-panel)]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-extrabold">{editing._id ? "Sửa bài viết" : "Tạo bài viết"}</h2>
              <Button variant="ghost" size="icon-sm" onClick={() => setEditing(null)} aria-label="Đóng"><X className="size-4" /></Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm font-bold md:col-span-2">Tiêu đề<Input value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></label>
              <label className="space-y-1 text-sm font-bold">Danh mục<Input value={editing.category || ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></label>
              <label className="space-y-1 text-sm font-bold">Chủ đề
                <Input list="news-topics" value={editing.topic || ""} onChange={(e) => setEditing({ ...editing, topic: e.target.value })} placeholder="Chọn hoặc nhập chủ đề" />
                <datalist id="news-topics">{topics.map((topic) => <option key={topic} value={topic} />)}</datalist>
              </label>
              <label className="space-y-1 text-sm font-bold">Trạng thái
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={editing.status || "published"} onChange={(e) => setEditing({ ...editing, status: e.target.value as NewsRecord["status"] })}>
                  <option value="published">Đã công bố</option>
                  <option value="draft">Bản nháp</option>
                  <option value="archived">Lưu trữ</option>
                </select>
              </label>
              <div className="md:col-span-2">
                <ImageUploadField label="Ảnh bìa" value={editing.coverImage || ""} onChange={(coverImage) => setEditing({ ...editing, coverImage })} recommended="JPG, PNG hoặc WEBP. Nếu ảnh lỗi, trang public sẽ dùng ảnh mặc định." />
              </div>
              <label className="space-y-1 text-sm font-bold md:col-span-2">Tóm tắt<Input value={editing.excerpt || ""} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} /></label>
              <div className="space-y-1 md:col-span-2">
                <span className="text-sm font-bold">Nội dung rich text</span>
                <RichTextEditor value={editing.content || ""} onChange={(content) => setEditing({ ...editing, content })} minHeight={280} />
              </div>
              <div className="md:col-span-2">
                <span className="mb-2 block text-sm font-bold">Xem trước nội dung</span>
                <div className="rounded-xl border border-border bg-background p-4">
                  <RichTextRenderer html={editing.content || "<p>Chưa có nội dung.</p>"} className="rich-text-content" />
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>Hủy</Button>
              <Button onClick={() => void submit()} disabled={saving}><Save className="size-4" /> {saving ? "Đang lưu..." : "Lưu bài viết"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNewsMgmtPage;
