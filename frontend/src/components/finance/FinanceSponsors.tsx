import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { financeService } from "@/services/financeService";
import type { Sponsor } from "@/components/admin/finance-management";
import { toast } from "sonner";

const money = (val: number) => val.toLocaleString("vi-VN");

interface Props {
  tournamentId: string;
  sponsors: Sponsor[];
  fetchData: () => Promise<void>;
}

const defaultForm = {
  name: "", amount: "", sponsorType: "Gold", sponsorshipType: "Money", website: "",
  contactName: "", contactPhone: "", contactEmail: "", status: "Active"
};

export function FinanceSponsors({ tournamentId, sponsors, fetchData }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const handleAdd = () => {
    setEditingId(null);
    setForm(defaultForm);
    setIsModalOpen(true);
  };

  const handleEdit = (s: Sponsor) => {
    setEditingId(s._id);
    setForm({
      name: s.name || "",
      amount: s.amount?.toString() || "",
      sponsorType: s.sponsorType || "Gold",
      sponsorshipType: s.sponsorshipType || "Money",
      website: s.website || "",
      contactName: s.contactPerson?.name || "",
      contactPhone: s.contactPerson?.phone || "",
      contactEmail: s.contactPerson?.email || "",
      status: s.status || "Active",
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.amount) return toast.error("Vui lòng nhập tên và số tiền");
    
    const payload = {
      ...form,
      amount: Number(form.amount),
      tournamentId,
      contactPerson: { name: form.contactName, phone: form.contactPhone, email: form.contactEmail }
    };

    try {
      if (editingId) await financeService.updateSponsor(editingId, payload);
      else await financeService.createSponsor(payload);
      
      toast.success(editingId ? "Đã cập nhật" : "Đã thêm nhà tài trợ");
      setIsModalOpen(false);
      void fetchData();
    } catch {
      toast.error("Có lỗi xảy ra khi lưu");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa?")) return;
    try {
      await financeService.deactivateSponsor(id);
      toast.success("Đã vô hiệu hóa nhà tài trợ");
      void fetchData();
    } catch {
      toast.error("Có lỗi xảy ra khi xóa");
    }
  };

  const getBadgeColor = (type: string) => {
    if (type === "Gold") return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200";
    if (type === "Silver") return "bg-slate-200 text-slate-700 hover:bg-slate-300 border-slate-300";
    if (type === "Bronze") return "bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200";
    return "bg-slate-100 text-slate-800";
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between py-4 rounded-t-xl">
        <CardTitle className="text-lg font-bold text-slate-800">Danh sách nhà tài trợ</CardTitle>
        <Button onClick={handleAdd} className="gap-2 bg-sky-600 hover:bg-sky-700"><Plus className="h-4 w-4" /> Thêm nhà tài trợ</Button>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="font-bold">Nhà tài trợ</TableHead>
              <TableHead className="font-bold">Loại</TableHead>
              <TableHead className="font-bold">Số tiền</TableHead>
              <TableHead className="font-bold">Liên hệ</TableHead>
              <TableHead className="font-bold">Trạng thái</TableHead>
              <TableHead className="text-right font-bold">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sponsors.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-slate-500 py-8">Chưa có nhà tài trợ nào.</TableCell></TableRow>
            ) : sponsors.map((s) => (
              <TableRow key={s._id} className="hover:bg-slate-50">
                <TableCell>
                  <div className="font-bold text-slate-800">{s.name}</div>
                  {s.website && <div className="text-[10px] text-slate-400">{s.website}</div>}
                </TableCell>
                <TableCell><Badge variant="outline" className={`font-bold shadow-none ${getBadgeColor(s.sponsorType)}`}>{s.sponsorType || "Gold"}</Badge></TableCell>
                <TableCell className="text-emerald-600 font-bold">+{money(s.amount)} ₫</TableCell>
                <TableCell className="text-xs text-slate-600"><div>{s.contactPerson?.name || '---'}</div><div>{s.contactPerson?.phone}</div></TableCell>
                <TableCell><Badge variant={s.status === 'Active' ? 'default' : 'secondary'} className={s.status === 'Active' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-none' : 'shadow-none'}>{s.status === 'Active' ? 'Hoạt động' : 'Đã dừng'}</Badge></TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(s)} className="text-sky-600 hover:text-sky-700 hover:bg-sky-50"><Edit2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(s._id)} className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>{editingId ? "Sửa nhà tài trợ" : "Thêm nhà tài trợ"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Tên nhà tài trợ *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Số tiền *</Label><Input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} /></div>
              <div className="space-y-2"><Label>Loại</Label><Select value={form.sponsorType} onValueChange={v => setForm({...form, sponsorType: v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Gold">Gold</SelectItem><SelectItem value="Silver">Silver</SelectItem><SelectItem value="Bronze">Bronze</SelectItem></SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label>Website</Label><Input value={form.website} onChange={e => setForm({...form, website: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Người liên hệ</Label><Input value={form.contactName} onChange={e => setForm({...form, contactName: e.target.value})} /></div>
              <div className="space-y-2"><Label>SĐT</Label><Input value={form.contactPhone} onChange={e => setForm({...form, contactPhone: e.target.value})} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button><Button onClick={handleSave}>{editingId ? "Cập nhật" : "Thêm mới"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
