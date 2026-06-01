import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, Upload } from "lucide-react";
import { financeService } from "@/services/financeService";
import type { Sponsor } from "@/types/sponsor";
import { toast } from "sonner";

const money = (val: number) => val.toLocaleString("vi-VN");

interface Props {
  tournamentId: string;
  sponsors: Sponsor[];
  fetchData: () => Promise<void>;
}

const defaultForm = {
  name: "", amount: "", sponsorType: "Vàng", sponsorshipType: "Money", website: "",
  contactName: "", contactPhone: "", contactEmail: ""
};

export function FinanceSponsors({ tournamentId, sponsors, fetchData }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    setEditingId(null);
    setForm(defaultForm);
    setLogoFile(null);
    setLogoPreview(null);
    setIsModalOpen(true);
  };

  const handleEdit = (s: Sponsor) => {
    setEditingId(s._id);
    setForm({
      name: s.name || "",
      amount: s.amount?.toString() || "",
      sponsorType: s.sponsorType || "Vàng",
      sponsorshipType: s.sponsorshipType || "Money",
      website: s.website || "",
      contactName: s.contactPerson?.name || "",
      contactPhone: s.contactPerson?.phone || "",
      contactEmail: s.contactPerson?.email || "",
    });
    setLogoFile(null);
    setLogoPreview(s.logo ? `http://localhost:5001/${s.logo.replace(/\\/g, '/')}` : null);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.amount) return toast.error("Vui lòng nhập tên và số tiền");
    
    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("amount", form.amount);
    formData.append("sponsorType", form.sponsorType);
    formData.append("sponsorshipType", form.sponsorshipType);
    formData.append("website", form.website);
    formData.append("tournamentId", tournamentId);
    formData.append("contactPerson", JSON.stringify({
      name: form.contactName, phone: form.contactPhone, email: form.contactEmail
    }));
    
    if (logoFile) {
      formData.append("logo", logoFile);
    }

    try {
      if (editingId) await financeService.updateSponsor(editingId, formData);
      else await financeService.createSponsor(formData);
      
      toast.success(editingId ? "Đã cập nhật" : "Đã thêm nhà tài trợ");
      setIsModalOpen(false);
      void fetchData();
    } catch {
      toast.error("Có lỗi xảy ra khi lưu");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn nhà tài trợ này?")) return;
    try {
      await financeService.deleteSponsor(id); 
      toast.success("Đã xóa nhà tài trợ");
      void fetchData();
    } catch {
      toast.error("Có lỗi xảy ra khi xóa");
    }
  };

  const getBadgeColor = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("vàng") || t.includes("gold")) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (t.includes("bạc") || t.includes("silver")) return "bg-slate-200 text-slate-700 border-slate-300";
    if (t.includes("đồng") || t.includes("bronze")) return "bg-orange-100 text-orange-800 border-orange-200";
    if (t.includes("kim cương") || t.includes("diamond")) return "bg-cyan-100 text-cyan-800 border-cyan-200";
    return "bg-sky-100 text-sky-800 border-sky-200";
  };

  return (
    <Card className="border-slate-200 shadow-sm mt-6">
      <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between py-4 rounded-t-xl">
        <CardTitle className="text-lg font-bold text-slate-800">Danh sách nhà tài trợ</CardTitle>
        <Button onClick={handleAdd} className="gap-2 bg-sky-600 hover:bg-sky-700"><Plus className="h-4 w-4" /> Thêm nhà tài trợ</Button>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="font-bold">Logo</TableHead>
              <TableHead className="font-bold">Nhà tài trợ</TableHead>
              <TableHead className="font-bold">Loại</TableHead>
              <TableHead className="font-bold">Số tiền</TableHead>
              <TableHead className="font-bold">Liên hệ</TableHead>
              <TableHead className="text-right font-bold">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sponsors.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-slate-500 py-8">Chưa có nhà tài trợ nào.</TableCell></TableRow>
            ) : sponsors.map((s) => (
              <TableRow key={s._id } className="hover:bg-slate-50">
                <TableCell>
                  {s.logo ? (
                    <img src={`http://localhost:5001/${s.logo.replace(/\\/g, '/')}`} alt={s.name} className="h-10 w-10 object-contain rounded-md border bg-white" />
                  ) : (
                    <div className="h-10 w-10 bg-slate-100 rounded-md border flex items-center justify-center text-xs text-slate-400">N/A</div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="font-bold text-slate-800">{s.name}</div>
                  {s.website && <div className="text-[10px] text-slate-400">{s.website}</div>}
                </TableCell>
                <TableCell><Badge variant="outline" className={`font-bold shadow-none ${getBadgeColor(s.sponsorType || '')}`}>{s.sponsorType || "Vàng"}</Badge></TableCell>
                <TableCell className="text-emerald-600 font-bold">+{money(s.amount)} ₫</TableCell>
                <TableCell className="text-xs text-slate-600"><div>{s.contactPerson?.name || '---'}</div><div>{s.contactPerson?.phone}</div></TableCell>
                
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
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-2">
            
            <div className="flex flex-col items-center gap-3">
              <div 
                className="h-24 w-40 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center bg-slate-50 cursor-pointer hover:bg-slate-100 overflow-hidden"
                onClick={() => fileInputRef.current?.click()}
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" />
                ) : (
                  <div className="text-center text-slate-500 flex flex-col items-center">
                    <Upload className="h-6 w-6 mb-1" />
                    <span className="text-xs font-medium">Tải Logo lên</span>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>

            <div className="space-y-2"><Label>Tên nhà tài trợ *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Số tiền *</Label><Input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} /></div>
              <div className="space-y-2"><Label>Loại hình tài trợ (Vàng, Bạc...)</Label><Input value={form.sponsorType} onChange={e => setForm({...form, sponsorType: e.target.value})} placeholder="Vàng, Bạc, Đồng..." /></div>
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
