import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import MgmtStats from "@/components/org/tournament-mgmt/MgmtStats";
import MgmtFilters from "@/components/org/tournament-mgmt/MgmtFilters";
import MgmtDataTable from "@/components/org/tournament-mgmt/MgmtDataTable";
import CreateTournamentModal from "@/components/org/tournament-mgmt/create-sections/CreateTournamentModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOrgTournamentMgmtStore } from "@/stores/useOrgTournamentMgmtStore";
import { useOrgContextStore } from "@/stores/useOrgContextStore";
import type { TournamentRecord } from "@/types/orgTournamentMgmt";

const OrgTournamentMgmtPage = () => {
  const { stats, records, loading, fetchData, deleteTournament } = useOrgTournamentMgmtStore();
  const fetchContextTournaments = useOrgContextStore((state) => state.fetchTournaments);
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<"multi" | "single">("multi");

  const refreshData = useCallback(async () => {
    await fetchData();
    await fetchContextTournaments();
  }, [fetchData, fetchContextTournaments]);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  const filteredRecords = useMemo(
    () => records.filter((record) => record.kind === activeTab),
    [records, activeTab],
  );

  const handleDelete = async (record: TournamentRecord) => {
    const ok = window.confirm(`Xóa "${record.name}"? Hệ thống sẽ hủy mềm giải đấu này.`);
    if (!ok) return;
    await deleteTournament(record.id, record.kind);
    await fetchContextTournaments();
  };

  if (loading && records.length === 0) {
    return (
      <div className="flex h-full items-center justify-center font-medium text-muted-foreground animate-pulse">
        Đang tải danh sách giải...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="relative flex flex-col gap-4 overflow-hidden rounded-lg bg-header p-6 text-white shadow-lg md:flex-row md:items-end md:justify-between md:p-8">
        <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/3 rounded-full bg-white/5 blur-3xl" />
        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase text-white/70">
            <span>Cổng tổ chức</span> <span className="text-accent">&gt;</span> <span>Tổng quan</span>
          </div>
          <h1 className="mb-1 text-3xl font-black uppercase tracking-wider">Danh sách Giải</h1>
          <p className="text-sm text-white/70">
            Tạo hội thao nhìều môn, giải đơn một môn và quản lý CRUD trên cùng một màn hình.
          </p>
        </div>
        <div className="relative z-10 flex w-full flex-wrap gap-3 md:w-auto">
          <Button variant="outline" className="flex-1 border-white/20 bg-white text-foreground hover:bg-white/90 md:flex-none">
            <Download className="mr-2 h-4 w-4" /> Xuất dữ liệu
          </Button>
          <Button variant="outline" className="flex-1 border-white/20 bg-white text-foreground hover:bg-white/90 md:flex-none">
            <Copy className="mr-2 h-4 w-4" /> Dùng mẫu
          </Button>
          <CreateTournamentModal onSuccess={refreshData}>
            <Button className="bg-primary font-bold text-white shadow-sm hover:bg-primary-hover">
              <Plus className="mr-2 h-4 w-4" /> Khởi tạo giải
            </Button>
          </CreateTournamentModal>
        </div>
      </div>

      <MgmtStats stats={stats} />

      <div className="space-y-4">
        <div className="flex w-full rounded-lg border border-border bg-card p-1 shadow-sm sm:w-max">
          <button
            type="button"
            onClick={() => setActiveTab("multi")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-bold transition-colors sm:flex-none ${
              activeTab === "multi" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Hội thao ({records.filter((record) => record.kind === "multi").length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("single")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-bold transition-colors sm:flex-none ${
              activeTab === "single" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Giải đơn ({records.filter((record) => record.kind === "single").length})
          </button>
        </div>
        <MgmtFilters />
        <MgmtDataTable records={filteredRecords} isMobile={isMobile} onDelete={handleDelete} />

        <div className="flex flex-col items-center justify-between gap-4 pt-4 text-sm text-muted-foreground sm:flex-row">
          <div>
            Hiển thị <span className="font-bold text-foreground">{filteredRecords.length}</span> giải
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span>Số dòng:</span>
              <select className="border-b border-border bg-transparent font-medium focus:outline-none">
                <option>10</option>
                <option>20</option>
              </select>
            </div>
            <div className="flex gap-1">
              <button className="rounded px-2 py-1 hover:bg-muted">&lt;</button>
              <button className="rounded bg-primary px-2.5 py-1 font-bold text-white">1</button>
              <button className="rounded px-2 py-1 hover:bg-muted">&gt;</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrgTournamentMgmtPage;
