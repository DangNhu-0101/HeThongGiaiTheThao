import { useEffect, useState, type FormEvent } from "react";
import { Check, MapPin, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import api, { getApiErrorMessage } from "@/libs/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CourtStatus = "empty" | "busy" | "maintenance" | "inactived";
type Court = { _id: string; name: string; location: string; status: CourtStatus; sportTypes?: string[] };
type SportApiItem = { name?: string; displayName?: string; sportType?: string };
type CourtForm = { name: string; location: string; sportTypes: string[]; status: CourtStatus };

const blank: CourtForm = { name: "", location: "", sportTypes: [], status: "empty" };
const asList = <T,>(value: T[] | { data?: T[] }): T[] => Array.isArray(value) ? value : value.data || [];

export default function AdminCourtsPage() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [sports, setSports] = useState<string[]>([]);
  const [form, setForm] = useState<CourtForm>(blank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [courtResponse, sportResponse] = await Promise.all([
        api.get<{ data: Court[] }>("/courts"),
        api.get<SportApiItem[] | { data?: SportApiItem[] }>("/rules/sports"),
      ]);
      setCourts(courtResponse.data.data || []);
      setSports(Array.from(new Set(asList(sportResponse.data)
        .map((item) => String(item.displayName || item.name || item.sportType || "").trim())
        .filter(Boolean))));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể tải danh sách sân."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const closeForm = () => {
    setEditingId(null);
    setForm(blank);
    setShowForm(false);
  };

  const toggleSport = (sport: string) => {
    setForm((current) => ({
      ...current,
      sportTypes: current.sportTypes.includes(sport)
        ? current.sportTypes.filter((item) => item !== sport)
        : [...current.sportTypes, sport],
    }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (form.sportTypes.length === 0) {
      toast.error("Vui lòng chọn ít nhất một môn sử dụng sân.");
      return;
    }
    setSaving(true);
    try {
      if (editingId) await api.put(`/courts/${editingId}`, form);
      else await api.post("/courts", form);
      toast.success(editingId ? "Đã cập nhật sân." : "Đã tạo sân.");
      closeForm();
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể lưu sân."));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (court: Court) => {
    setEditingId(court._id);
    setForm({ name: court.name, location: court.location, sportTypes: court.sportTypes || [], status: court.status });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase text-primary">Quản trị nền tảng</p>
          <h1 className="mt-2 text-3xl font-black">Danh mục sân thi đấu</h1>
          <p className="mt-2 text-muted-foreground">Sân chỉ xuất hiện khi môn của giải khớp với một trong các môn được cấu hình cho sân.</p>
        </div>
        {!showForm && <Button type="button" onClick={() => setShowForm(true)}><Plus className="size-4" /> Thêm sân</Button>}
      </header>

      {showForm && (
        <form onSubmit={submit} className="space-y-5 rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div><h2 className="font-black">{editingId ? "Cập nhật sân" : "Thêm sân mới"}</h2><p className="text-xs text-muted-foreground">Nhập thông tin và chọn tất cả môn có thể thi đấu tại sân.</p></div>
            <Button type="button" size="icon" variant="ghost" onClick={closeForm} aria-label="Đóng biểu mẫu"><X className="size-4" /></Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Input required aria-label="Tên sân" placeholder="Tên sân" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <Input required aria-label="Địa điểm" placeholder="Địa điểm" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
            <select aria-label="Trạng thái" className="h-10 rounded-md border bg-background px-3" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as CourtStatus })}>
              <option value="empty">Sẵn sàng</option><option value="busy">Đang dùng</option><option value="maintenance">Bảo trì</option><option value="inactived">Ngừng hoạt động</option>
            </select>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-bold">Môn sử dụng sân *</legend>
            <div className="flex flex-wrap gap-2">
              {sports.map((sport) => {
                const selected = form.sportTypes.includes(sport);
                return <button key={sport} type="button" onClick={() => toggleSport(sport)} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${selected ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:border-primary/50"}`}>{selected && <Check className="size-4" />}{sport}</button>;
              })}
            </div>
            {sports.length === 0 && <p className="text-sm text-amber-700">Chưa có môn đang hoạt động trong cấu hình môn thi.</p>}
          </fieldset>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={closeForm}>Hủy</Button><Button type="submit" disabled={saving || sports.length === 0}>{saving ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Tạo sân"}</Button></div>
        </form>
      )}

      <div className="overflow-hidden rounded-2xl border bg-card">
        {loading ? <p className="p-6">Đang tải...</p> : courts.length === 0 ? <p className="p-6 text-muted-foreground">Chưa có sân thi đấu.</p> : courts.map((court) => (
          <div key={court._id} className="flex flex-col gap-3 border-b p-4 last:border-0 sm:flex-row sm:items-center">
            <MapPin className="size-5 text-primary" />
            <div className="min-w-0 flex-1"><p className="font-bold">{court.name}</p><p className="text-sm text-muted-foreground">{court.location}</p><div className="mt-2 flex flex-wrap gap-1">{court.sportTypes?.length ? court.sportTypes.map((sport) => <span key={sport} className="rounded bg-muted px-2 py-0.5 text-xs font-semibold">{sport}</span>) : <span className="text-xs text-amber-700">Chưa cấu hình môn</span>}</div></div>
            <Button type="button" variant="outline" size="sm" onClick={() => startEdit(court)}><Pencil className="size-4" /> Sửa</Button>
            <Button type="button" variant="destructive" size="sm" className="text-white hover:text-white" onClick={async () => { if (!confirm(`Xóa sân ${court.name}?`)) return; try { await api.delete(`/courts/${court._id}`); await load(); } catch (error) { toast.error(getApiErrorMessage(error, "Không thể xóa sân.")); } }}><Trash2 className="size-4" /> Xóa</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
