import { useState, useEffect } from "react";
import { X, Image as ImageIcon } from "lucide-react";
import type { SponsorRecord } from "@/types/orgFinanceMgmt";
import { Button } from "@/components/ui/button";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sponsor: any) => void;
  editingSponsor?: SponsorRecord | null;
}

const SponsorDialog = ({ isOpen, onClose, onSave, editingSponsor }: Props) => {
  const [formData, setFormData] = useState({ name: '', logoUrl: '', tier: 'Tài trợ Vàng', amount: '', status: 'Active' });

  useEffect(() => {
    if (editingSponsor) {
      setFormData({ ...editingSponsor, amount: editingSponsor.amount.toString() });
    } else {
      setFormData({ name: '', logoUrl: '', tier: 'Tài trợ Vàng', amount: '', status: 'Active' });
    }
  }, [editingSponsor, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, amount: Number(formData.amount) });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-border bg-muted/20">
          <h3 className="font-bold text-foreground">{editingSponsor ? 'Chỉnh sửa Nhà tài trợ' : 'Thêm Nhà tài trợ mới'}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:bg-muted p-1 rounded-md"><X className="w-5 h-5"/></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Tên đơn vị</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:border-primary" placeholder="Nhập tên nhà tài trợ..." />
          </div>
          
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">URL Logo / Hình ảnh</label>
            <div className="flex gap-2">
              <div className="w-10 h-10 bg-muted rounded-lg border border-border flex items-center justify-center shrink-0 overflow-hidden">
                 {formData.logoUrl ? <img src={formData.logoUrl} className="w-full h-full object-cover" alt="Preview"/> : <ImageIcon className="w-4 h-4 text-muted-foreground"/>}
              </div>
              <input required type="url" value={formData.logoUrl} onChange={e => setFormData({...formData, logoUrl: e.target.value})} className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:border-primary" placeholder="https://..." />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Gói tài trợ</label>
              <select value={formData.tier} onChange={e => setFormData({...formData, tier: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:border-primary">
                <option>Tài trợ Kim Cương</option>
                <option>Tài trợ Vàng</option>
                <option>Tài trợ Bạc</option>
                <option>Đồng tài trợ</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Số tiền (VNĐ)</label>
              <input required type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:border-primary" placeholder="0" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Trạng thái</label>
            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:border-primary">
              <option value="Active">Đang hợp tác (Active)</option>
              <option value="Expired">Hết hạn (Expired)</option>
            </select>
          </div>

          <div className="pt-4 flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Hủy</Button>
            <Button type="submit" className="flex-1 bg-primary text-white">Lưu thông tin</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default SponsorDialog;