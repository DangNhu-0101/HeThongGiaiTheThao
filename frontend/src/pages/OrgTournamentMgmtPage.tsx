import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import MgmtStats from "@/components/org/tournament-mgmt/MgmtStats";
import MgmtDataTable from "@/components/org/tournament-mgmt/MgmtDataTable";
import CreateTournamentModal from "@/components/org/tournament-mgmt/create-sections/CreateTournamentModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOrgTournamentMgmtStore } from "@/stores/useOrgTournamentMgmtStore";
import { useOrgContextStore } from "@/stores/useOrgContextStore";
import type { TournamentRecord } from "@/types/orgTournamentMgmt";

const PAGE_SIZE = 10;

const OrgTournamentMgmtPage = () => {
  const { action } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { stats, records, loading, fetchData, deleteTournament } = useOrgTournamentMgmtStore();
  const fetchContextTournaments = useOrgContextStore((state) => state.fetchTournaments);
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<"all" | "multi" | "single">("all");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sport, setSport] = useState("all");
  const [page, setPage] = useState(1);
  const isCreateRoute = action === "create" || location.pathname.endsWith("/org/tournaments/create");

  const refreshData = useCallback(async () => {
    await fetchData();
    await fetchContextTournaments();
  }, [fetchData, fetchContextTournaments]);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  const sports = useMemo(() => Array.from(new Set(records.map((record) => record.sport).filter(Boolean))), [records]);

  const filteredRecords = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return records.filter((record) => {
      const matchTab = activeTab === "all" || record.kind === activeTab;
      const matchStatus = status === "all" || record.status === status;
      const matchSport = sport === "all" || record.sport === sport;
      const haystack = `${record.name} ${record.sport} ${record.format} ${record.venue || ""}`.toLowerCase();
      return matchTab && matchStatus && matchSport && (!keyword || haystack.includes(keyword));
    });
  }, [activeTab, records, search, sport, status]);

  const pageCount = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const pageRecords = filteredRecords.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    queueMicrotask(() => setPage(1));
  }, [activeTab, search, sport, status]);

  const handleDelete = async (record: TournamentRecord) => {
    const ok = window.confirm(`Xóa "${record.name}"? Hệ thống sẽ gọi API để xóa hoặc hủy mềm giải này, không chỉ xóa trên giao diện.`);
    if (!ok) return;
    try {
      await deleteTournament(record.id, record.kind);
      await refreshData();
      toast.success("Đã xóa giải khỏi danh sách.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể xóa giải. Vui lòng thử lại.";
      toast.error(message);
    }
  };

  if (loading && records.length === 0) {
    return <div className="flex h-full items-center justify-center font-medium text-muted-foreground animate-pulse">Đang tải danh sách giải...</div>;
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="relative flex flex-col gap-4 overflow-hidden rounded-lg bg-header p-6 text-white shadow-lg md:flex-row md:items-end md:justify-between md:p-8">
        <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/3 rounded-full bg-white/5 blur-3xl" />
        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase text-white/80">
            <span>Cổng tổ chức</span> <span className="text-accent">&gt;</span> <span>Tổng quan</span>
          </div>
          <h1 className="mb-1 text-3xl font-black uppercase tracking-wider text-white">Danh sách giải</h1>
          <p className="text-sm text-white/80">Tạo hội thao nhiều môn, giải đơn một môn và quản lý CRUD trên cùng một màn hình.</p>
        </div>
        <div className="relative z-10 flex w-full flex-wrap gap-3 md:w-auto">

          <CreateTournamentModal onSuccess={refreshData} defaultOpen={isCreateRoute} onOpenChange={(open) => { if (!open && isCreateRoute) navigate("/org/tournaments", { replace: true }); }}>
            <Button className="bg-primary font-bold text-white shadow-sm hover:bg-primary-hover">
              <Plus className="mr-2 h-4 w-4" /> Khởi tạo giải
            </Button>
          </CreateTournamentModal>
        </div>
      </div>

      <MgmtStats stats={stats} />

      <div className="space-y-4">
        <div className="flex w-full overflow-hidden rounded-lg border border-border bg-card p-1 shadow-sm sm:w-max">
          {[
            ["all", `Tất cả (${records.length})`],
            ["multi", `Hội thao (${records.filter((record) => record.kind === "multi").length})`],
            ["single", `Giải đơn (${records.filter((record) => record.kind === "single").length})`],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-bold transition-colors sm:flex-none ${activeTab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid gap-3 rounded-xl border border-border bg-card p-4 shadow-sm lg:grid-cols-[1fr_180px_180px]">
          <label className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên giải, môn, thể thức, địa điểm" className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm outline-none focus:ring-4 focus:ring-ring/20" />
          </label>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm">
            <option value="all">Tất cả trạng thái</option>
            <option value="Registration Open">Mở đăng ký</option>
            <option value="Live">Đang diễn ra</option>
            <option value="Completed">Hoàn tất</option>
            <option value="Draft">Bản nháp</option>
          </select>
          <select value={sport} onChange={(event) => setSport(event.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm">
            <option value="all">Tất cả môn</option>
            {sports.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>

        <MgmtDataTable records={pageRecords} isMobile={isMobile} onDelete={handleDelete} onUpdated={refreshData} />

        <div className="flex flex-col items-center justify-between gap-4 pt-4 text-sm text-muted-foreground sm:flex-row">
          <div>Hiển thị <span className="font-bold text-foreground">{pageRecords.length}</span> / {filteredRecords.length} giải</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Trước</Button>
            <span className="rounded bg-primary px-2.5 py-1 font-bold text-white">{page}/{pageCount}</span>
            <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Sau</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrgTournamentMgmtPage;
