import { useEffect, useState } from "react";
import { Edit, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import FeeProgressCard from "@/components/org/finance-mgmt/FeeProgressCard";
import SponsorDialog from "@/components/org/finance-mgmt/SponsorDialog";
import RequireTournamentSelection from "@/components/org/RequireTournamentSelection";
import { useOrgFinanceMgmtStore } from "@/stores/useOrgFinanceMgmtStore";
import { useOrgContextStore } from "@/stores/useOrgContextStore";
import type { SponsorRecord } from "@/types/orgFinanceMgmt";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

const OrgFinanceMgmtPage = () => {
  const { feeProgress, sponsors, sponsorPackages, loading, fetchData, addSponsor, updateSponsor, deleteSponsor } = useOrgFinanceMgmtStore();
  const selectedTournamentItemId = useOrgContextStore((state) => state.selectedTournamentItemId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<SponsorRecord | null>(null);

  useEffect(() => {
    if (!selectedTournamentItemId) return;
    void fetchData(selectedTournamentItemId);
  }, [fetchData, selectedTournamentItemId]);

  if (!selectedTournamentItemId) {
    return <RequireTournamentSelection description="Hãy chọn giải ở Sidebar để quản lý tài trợ và lệ phí của giải đó." />;
  }

  if (loading || !feeProgress) {
    return <div className="flex h-full items-center justify-center font-medium text-muted-foreground animate-pulse">Đang tải dữ liệu...</div>;
  }

  const handleOpenAdd = () => {
    setEditingSponsor(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (sponsor: SponsorRecord) => {
    setEditingSponsor(sponsor);
    setIsDialogOpen(true);
  };

  const handleSaveSponsor = async (data: SponsorRecord) => {
    if (editingSponsor) {
      await updateSponsor(editingSponsor.id, data);
    } else {
      await addSponsor(data);
    }
  };

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col space-y-8 pb-12">
      <div className="relative flex shrink-0 flex-col gap-4 overflow-hidden rounded-lg bg-header p-6 text-white shadow-lg md:flex-row md:items-end md:justify-between">
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/3 rounded-full bg-white/5 blur-3xl" />
        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase text-white/70">
            <span>Cổng Tổ Chức</span> <span className="text-accent">&gt;</span> <span>Tài chính</span>
          </div>
          <h1 className="mb-1 text-3xl font-black uppercase tracking-wider">Quản lý Lệ phí & Tài trợ</h1>
          <p className="text-sm text-white/70">Theo dõi tiến độ thu lệ phí và quản lý hình ảnh quảng bá đối tác.</p>
        </div>
      </div>

      <FeeProgressCard data={feeProgress} />

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-black uppercase text-foreground">Danh mục gói tài trợ</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Các gói đã được cấu hình khi tạo hoặc cập nhật giải đang chọn.</p>
        </div>
        {sponsorPackages.length ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sponsorPackages.map((item) => (
              <div key={item.name} className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-foreground">{item.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{item.benefits || "Chưa có mô tả quyền lợi."}</p>
                  </div>
                  <span className="rounded bg-primary/10 px-2 py-1 text-xs font-bold text-primary">{formatCurrency(item.amount || 0)}</span>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">Số lượng: {item.slots || 0}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
            Chưa có gói tài trợ được cấu hình cho giải này.
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black uppercase text-foreground">Danh sách Nhà Tài Trợ</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Quản lý thông tin, danh mục tài trợ và logo để hiển thị lên trang công chúng.</p>
          </div>
          <Button onClick={handleOpenAdd} disabled={!sponsorPackages.length} className="bg-primary text-white shadow-sm hover:bg-primary-hover disabled:opacity-60">
            <Plus className="mr-2 h-4 w-4" /> Thêm đối tác
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sponsors.map((sponsor) => (
            <div key={sponsor.id} className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
              <div className="relative flex h-32 items-center justify-center border-b border-border/50 bg-muted/50 p-4">
                <img src={sponsor.logoUrl} alt={sponsor.name} className="max-h-full max-w-full object-contain drop-shadow-sm" />
                <span className={`absolute right-2 top-2 rounded px-2 py-0.5 text-[9px] font-bold uppercase ${sponsor.status === "Active" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                  {sponsor.status === "Active" ? "Đang hoạt động" : "Ngừng hiển thị"}
                </span>
              </div>

              <div className="flex flex-1 flex-col justify-between p-4">
                <div>
                  <h3 className="line-clamp-1 text-base font-bold text-foreground">{sponsor.name}</h3>
                  <span className="mt-1 inline-block rounded bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase text-accent-foreground">
                    {sponsor.tier}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <span className="font-black text-primary">{formatCurrency(sponsor.amount)}</span>
                  <div className="flex gap-1 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleOpenEdit(sponsor)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-red-50 hover:text-red-500" onClick={() => void deleteSponsor(sponsor.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <SponsorDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveSponsor}
        editingSponsor={editingSponsor}
        packages={sponsorPackages}
      />
    </div>
  );
};

export default OrgFinanceMgmtPage;
