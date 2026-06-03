import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Plus, Edit, Trash2 } from "lucide-react";
import { resourceService, type ApiCourt } from "@/services/resourceService";

const statusLabel: Record<string, string> = {
  empty: "Sẵn sàng",
  busy: "Đang sử dụng",
  maintenance: "Bảo trì",
  inActive: "Ngưng hoạt động",
};

export function CourtList() {
  const { id } = useParams<{ id: string }>();
  const isSystemWide = !id;
  const [courts, setCourts] = useState<ApiCourt[]>([]);
  const [editingCourt, setEditingCourt] = useState<ApiCourt | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", tournamentId: id || "", location: "", sportTypes: "", status: "empty" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadCourts = useCallback(async () => {
    await Promise.resolve();
    setIsLoading(true);
    try {
      setCourts(await resourceService.getCourts(id));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCourts();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadCourts]);

  const openCreate = () => {
    setEditingCourt(null);
    setForm({ name: "", tournamentId: id || "", location: "", sportTypes: "", status: "empty" });
    setIsDialogOpen(true);
  };

  const openEdit = (court: ApiCourt) => {
    setEditingCourt(court);
    setForm({
      name: court.name || "",
      tournamentId: typeof court.tournamentId === "string" ? court.tournamentId : court.tournamentId?._id || id || "",
      location: court.location || "",
      sportTypes: court.sportTypes?.join(", ") || "",
      status: court.status || "empty",
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên sân.");
      return;
    }
    if (!form.tournamentId.trim()) {
      toast.error("Vui lòng nhập tournamentId cho sân.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        tournamentId: form.tournamentId.trim(),
        location: form.location.trim(),
        sportTypes: form.sportTypes.split(",").map((item) => item.trim()).filter(Boolean),
        status: form.status as ApiCourt["status"],
      };

      if (editingCourt) {
        await resourceService.updateCourt(editingCourt._id, payload);
      } else {
        await resourceService.createCourt(payload);
      }

      toast.success(editingCourt ? "Đã cập nhật sân." : "Đã thêm sân.");
      setEditingCourt(null);
      setIsDialogOpen(false);
      await loadCourts();
    } catch {
      toast.error(editingCourt ? "Không thể cập nhật sân." : "Không thể thêm sân.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (court: ApiCourt) => {
    if (!window.confirm(`Xóa sân "${court.name}"?`)) return;
    try {
      await resourceService.deleteCourt(court._id);
      toast.success("Đã xóa sân.");
      await loadCourts();
    } catch {
      toast.error("Không thể xóa sân.");
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <MapPin className="h-6 w-6 text-sky-600" />
          {isSystemWide ? "Danh sách sân toàn hệ thống" : "Danh sách sân của giải đấu"}
        </h1>
        <Button className="gap-2 shadow-sm font-bold bg-sky-600 hover:bg-sky-700" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Thêm sân mới
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold text-slate-600 whitespace-nowrap">Tên sân</TableHead>
                <TableHead className="font-bold text-slate-600 whitespace-nowrap">Vị trí</TableHead>
                <TableHead className="font-bold text-slate-600 whitespace-nowrap">Môn</TableHead>
                <TableHead className="font-bold text-slate-600 whitespace-nowrap">Trạng thái</TableHead>
                <TableHead className="font-bold text-slate-600 whitespace-nowrap text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-sm text-slate-500">Đang tải sân đấu...</TableCell></TableRow>
              ) : courts.length ? courts.map((court) => (
                <TableRow key={court._id} className="hover:bg-slate-50">
                  <TableCell className="font-semibold text-slate-800 whitespace-nowrap">{court.name}</TableCell>
                  <TableCell className="text-slate-600 min-w-[200px]">{court.location || "Chưa cập nhật"}</TableCell>
                  <TableCell className="text-slate-600 whitespace-nowrap">{court.sportTypes?.join(", ") || "Chưa cấu hình"}</TableCell>
                  <TableCell>
                    <Badge variant={court.status === "empty" ? "default" : court.status === "maintenance" ? "destructive" : "secondary"} className="whitespace-nowrap shadow-none">
                      {statusLabel[court.status || ""] || court.status || "Chưa rõ"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button variant="ghost" size="icon" className="hover:bg-slate-200" onClick={() => openEdit(court)}><Edit className="h-4 w-4 text-slate-500" /></Button>
                    <Button variant="ghost" size="icon" className="hover:bg-rose-100" onClick={() => handleDelete(court)}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-sm text-slate-500">Chưa có sân đấu nào.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) setEditingCourt(null);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingCourt ? "Sửa sân đấu" : "Thêm sân đấu"}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1"><Label>Tên sân</Label><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
            <div className="space-y-1"><Label>Tournament ID</Label><Input value={form.tournamentId} disabled={!isSystemWide} onChange={(event) => setForm({ ...form, tournamentId: event.target.value })} /></div>
            <div className="space-y-1"><Label>Vị trí</Label><Input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></div>
            <div className="space-y-1"><Label>Môn thi đấu, cách nhau bằng dấu phẩy</Label><Input value={form.sportTypes} onChange={(event) => setForm({ ...form, sportTypes: event.target.value })} /></div>
            <div className="space-y-1">
              <Label>Trạng thái</Label>
              <select className="h-9 w-full rounded-md border px-3 text-sm" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                <option value="empty">Sẵn sàng</option>
                <option value="busy">Đang sử dụng</option>
                <option value="maintenance">Bảo trì</option>
                <option value="inActive">Ngưng hoạt động</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={isSaving}>{isSaving ? "Đang lưu..." : "Lưu"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
