import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCog, Plus, Edit, Trash2 } from "lucide-react";
import { resourceService, type ApiReferee } from "@/services/resourceService";

const getRefereeLevel = (referee: ApiReferee) => {
  const maxYears = Math.max(...(referee.sports || []).map((sport) => sport.yearsOfExperience || 0), 0);
  if (maxYears >= 5) return "Kinh nghiệm";
  if (maxYears >= 2) return "Trung cấp";
  return "Mới";
};

export function RefereeList() {
  const [referees, setReferees] = useState<ApiReferee[]>([]);
  const [editingReferee, setEditingReferee] = useState<ApiReferee | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    birthDate: "2000-01-01",
    gender: "other",
    category: "",
    yearsOfExperience: "0",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadReferees = useCallback(async () => {
    await Promise.resolve();
    setIsLoading(true);
    try {
      setReferees(await resourceService.getReferees());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadReferees();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadReferees]);

  const openCreate = () => {
    setEditingReferee(null);
    setForm({ name: "", email: "", phoneNumber: "", birthDate: "2000-01-01", gender: "other", category: "", yearsOfExperience: "0" });
    setIsDialogOpen(true);
  };

  const openEdit = (referee: ApiReferee) => {
    const firstSport = referee.sports?.[0];
    setEditingReferee(referee);
    setForm({
      name: referee.name || "",
      email: referee.email || "",
      phoneNumber: referee.phoneNumber || referee.phone || "",
      birthDate: referee.birthDate ? referee.birthDate.slice(0, 10) : "2000-01-01",
      gender: referee.gender || "other",
      category: firstSport?.category || "",
      yearsOfExperience: String(firstSport?.yearsOfExperience || 0),
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.phoneNumber.trim()) {
      toast.error("Vui lòng nhập tên và số điện thoại trọng tài.");
      return;
    }
    if (!editingReferee && !form.email.trim()) {
      toast.error("Vui lòng nhập email để tạo tài khoản trọng tài.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
        birthDate: form.birthDate,
        gender: form.gender as ApiReferee["gender"],
        sports: form.category ? [{ category: form.category.trim(), yearsOfExperience: Number(form.yearsOfExperience) || 0 }] : [],
      };

      if (editingReferee) {
        await resourceService.updateReferee(editingReferee._id, payload);
      } else {
        await resourceService.createReferee(payload);
      }

      toast.success(editingReferee ? "Đã cập nhật trọng tài." : "Đã thêm trọng tài.");
      setEditingReferee(null);
      setIsDialogOpen(false);
      await loadReferees();
    } catch {
      toast.error(editingReferee ? "Không thể cập nhật trọng tài." : "Không thể thêm trọng tài.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (referee: ApiReferee) => {
    if (!window.confirm(`Xóa trọng tài "${referee.name}"?`)) return;
    try {
      await resourceService.deleteReferee(referee._id);
      toast.success("Đã xóa trọng tài.");
      await loadReferees();
    } catch {
      toast.error("Không thể xóa trọng tài.");
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <UserCog className="h-6 w-6 text-sky-600" />
          Danh sách trọng tài
        </h1>
        <Button className="gap-2 shadow-sm font-bold bg-sky-600 hover:bg-sky-700" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Thêm trọng tài
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold text-slate-600 whitespace-nowrap">Họ và tên</TableHead>
                <TableHead className="font-bold text-slate-600 whitespace-nowrap">Kinh nghiệm</TableHead>
                <TableHead className="font-bold text-slate-600 whitespace-nowrap">Số điện thoại</TableHead>
                <TableHead className="font-bold text-slate-600 whitespace-nowrap">Môn phụ trách</TableHead>
                <TableHead className="font-bold text-slate-600 whitespace-nowrap text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-sm text-slate-500">Đang tải trọng tài...</TableCell></TableRow>
              ) : referees.length ? referees.map((referee) => (
                <TableRow key={referee._id} className="hover:bg-slate-50">
                  <TableCell className="font-bold text-slate-800 whitespace-nowrap">{referee.name}</TableCell>
                  <TableCell className="text-slate-600 font-medium whitespace-nowrap">{getRefereeLevel(referee)}</TableCell>
                  <TableCell className="text-slate-600 whitespace-nowrap">{referee.phoneNumber || referee.phone || "Chưa cập nhật"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="whitespace-nowrap shadow-none font-bold">
                      {(referee.sports || []).map((sport) => sport.category).filter(Boolean).join(", ") || "Chưa cấu hình"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button variant="ghost" size="icon" className="hover:bg-slate-200" onClick={() => openEdit(referee)}><Edit className="h-4 w-4 text-slate-500" /></Button>
                    <Button variant="ghost" size="icon" className="hover:bg-rose-100" onClick={() => handleDelete(referee)}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-sm text-slate-500">Chưa có trọng tài nào.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) setEditingReferee(null);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingReferee ? "Sửa trọng tài" : "Thêm trọng tài"}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1"><Label>Họ tên</Label><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
            <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email} disabled={!!editingReferee} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div>
            <div className="space-y-1"><Label>Số điện thoại</Label><Input value={form.phoneNumber} onChange={(event) => setForm({ ...form, phoneNumber: event.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Ngày sinh</Label><Input type="date" value={form.birthDate} onChange={(event) => setForm({ ...form, birthDate: event.target.value })} /></div>
              <div className="space-y-1">
                <Label>Giới tính</Label>
                <select className="h-9 w-full rounded-md border px-3 text-sm" value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })}>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>
            </div>
            <div className="space-y-1"><Label>Môn phụ trách</Label><Input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></div>
            <div className="space-y-1"><Label>Số năm kinh nghiệm</Label><Input type="number" min={0} value={form.yearsOfExperience} onChange={(event) => setForm({ ...form, yearsOfExperience: event.target.value })} /></div>
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
