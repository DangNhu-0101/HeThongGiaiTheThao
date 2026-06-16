import { useEffect, useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import FeeProgressCard from "@/components/org/finance-mgmt/FeeProgressCard";
import SponsorDialog from "@/components/org/finance-mgmt/SponsorDialog";
import { useOrgFinanceMgmtStore } from "@/stores/useOrgFinanceMgmtStore";
import type { SponsorRecord } from "@/types/orgFinanceMgmt";

const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const OrgFinanceMgmtPage = () => {
  const { feeProgress, sponsors, loading, fetchData, addSponsor, updateSponsor, deleteSponsor } = useOrgFinanceMgmtStore();
  
  // State quản lý Dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<SponsorRecord | null>(null);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading || !feeProgress) {
    return <div className="h-full flex items-center justify-center text-muted-foreground animate-pulse font-medium">Đang tải dữ liệu...</div>;
  }

  const handleOpenAdd = () => {
    setEditingSponsor(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (sponsor: SponsorRecord) => {
    setEditingSponsor(sponsor);
    setIsDialogOpen(true);
  };

  const handleSaveSponsor = (data: any) => {
    if (editingSponsor) {
      updateSponsor(editingSponsor.id, data);
    } else {
      addSponsor(data);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 flex flex-col pb-12">
      
      {/* Header/Hero Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-header text-white p-6 rounded-2xl shadow-lg relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-[10px] text-white/70 font-bold uppercase mb-2">
            <span>Cổng Tổ Chức</span> <span className="text-accent">&gt;</span> <span>Tài chính</span>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-wider mb-1">Quản lý Lệ phí & Tài trợ</h1>
          <p className="text-sm text-white/70">Theo dõi tiến độ thu lệ phí và quản lý hình ảnh quảng bá đối tác.</p>
        </div>
      </div>

      {/* Tầng 1: Tiến độ Lệ phí */}
      <FeeProgressCard data={feeProgress} />

      {/* Tầng 2: Danh sách Nhà tài trợ */}
      <div>
        <div className="flex justify-between items-center mb-4">
           <div>
             <h2 className="text-xl font-black text-foreground uppercase">Danh sách Nhà Tài Trợ</h2>
             <p className="text-xs text-muted-foreground mt-0.5">Quản lý thông tin và logo để hiển thị lên trang công chúng</p>
           </div>
           <Button onClick={handleOpenAdd} className="bg-primary hover:bg-primary-hover text-white shadow-sm">
             <Plus className="w-4 h-4 mr-2" /> Thêm đối tác
           </Button>
        </div>

        {/* Responsive Grid: 1 cột mobile, 2 cột tablet, 3 cột desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sponsors.map(sponsor => (
            <div key={sponsor.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col relative group">
              
              {/* Vùng Logo hiển thị lớn */}
              <div className="h-32 bg-muted/50 p-4 flex items-center justify-center border-b border-border/50 relative">
                <img src={sponsor.logoUrl} alt={sponsor.name} className="max-h-full max-w-full object-contain drop-shadow-sm" />
                <span className={`absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded uppercase ${sponsor.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {sponsor.status}
                </span>
              </div>

              {/* Thông tin */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-base text-foreground line-clamp-1">{sponsor.name}</h3>
                  <span className="inline-block bg-accent/10 text-accent-foreground text-[10px] font-bold px-2 py-0.5 rounded uppercase mt-1">
                    {sponsor.tier}
                  </span>
                </div>
                <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
                  <span className="font-black text-primary">{formatCurrency(sponsor.amount)}</span>
                  
                  {/* Nút thao tác ẩn/hiện khi hover trên Desktop, luôn hiện trên Mobile */}
                  <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleOpenEdit(sponsor)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50" onClick={() => deleteSponsor(sponsor.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Render Dialog (Sẽ ẩn nếu isDialogOpen = false) */}
      <SponsorDialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
        onSave={handleSaveSponsor} 
        editingSponsor={editingSponsor} 
      />

    </div>
  );
};

export default OrgFinanceMgmtPage;