import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowLeft, Filter, Search, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import SportDetailArea from "@/components/admin/sports-config/SportDetailArea";
import SportsCharts from "@/components/admin/sports-config/SportsCharts";
import { useAdminSportsConfigStore } from "@/stores/useAdminSportsConfigStore";
import { useIsMobile } from "@/hooks/use-mobile";

const AdminSportsConfigPage = () => {
  const isMobile = useIsMobile();
  const { stats, sports, usageData, formatData, selectedSportId, loading, fetchData, setSelectedSportId } = useAdminSportsConfigStore();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const filteredSports = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return sports.filter((sport) => {
      const matchSearch = !keyword || `${sport.name} ${sport.englishName || ""}`.toLowerCase().includes(keyword);
      const matchStatus = status === "all" || (status === "active" ? sport.status === "Hoạt động" : sport.status !== "Hoạt động");
      return matchSearch && matchStatus;
    });
  }, [search, sports, status]);

  useEffect(() => {
    if (!isMobile && filteredSports.length > 0 && !selectedSportId) setSelectedSportId(filteredSports[0].id);
  }, [filteredSports, isMobile, selectedSportId, setSelectedSportId]);

  const selectedSport = sports.find((item) => item.id === selectedSportId);

  const renderStats = () => (
    <div className="mb-6 flex shrink-0 gap-4 overflow-x-auto pb-2 beautiful-scrollbar">
      {stats.map((stat) => (
        <div key={stat.id} className="flex min-w-[160px] flex-1 flex-col justify-center rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-2 flex items-start justify-between">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.color} bg-muted`}>
              <Activity className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold text-green-600">{stat.trend}</span>
          </div>
          <h3 className="text-2xl font-black text-foreground">{stat.value}</h3>
          <p className="mt-1 text-[10px] font-bold uppercase text-muted-foreground">{stat.label}</p>
        </div>
      ))}
    </div>
  );

  const renderSportList = () => (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="shrink-0 space-y-4 border-b border-border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm kiếm môn thi..."
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <Filter className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 beautiful-scrollbar">
          {[
            ["all", "Tất cả"],
            ["active", "Hoạt động"],
            ["inactive", "Đã tắt"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatus(key as typeof status)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold ${status === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto p-2 beautiful-scrollbar">
        {filteredSports.map((sport) => (
          <button
            key={sport.id}
            type="button"
            onClick={() => setSelectedSportId(sport.id)}
            className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${selectedSportId === sport.id ? "border-primary/20 bg-primary/10" : "border-transparent hover:bg-muted"}`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary text-secondary-foreground shadow-sm">
              {sport.imageUrl ? <img src={sport.imageUrl} alt={sport.name} className="h-full w-full rounded-lg object-cover" /> : <Trophy className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className={`truncate text-sm font-bold ${selectedSportId === sport.id ? "text-primary" : "text-foreground"}`}>
                {sport.name}
                <span className={`ml-1 rounded px-1.5 py-0.5 text-[8px] uppercase ${sport.status === "Hoạt động" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                  {sport.status}
                </span>
              </h4>
              <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{sport.formatsCount} thể thức · {sport.rulesCount} hạng mục</p>
            </div>
          </button>
        ))}
        {filteredSports.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Không tìm thấy môn phù hợp.</div>
        )}
      </div>
    </div>
  );

  if (loading && sports.length === 0) {
    return <div className="flex h-full items-center justify-center font-medium text-muted-foreground animate-pulse">Đang tải cấu hình môn thi...</div>;
  }

  if (!loading && sports.length === 0) {
    return <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">Chưa có môn thể thao nào trong database. Hãy chạy seed competition config.</div>;
  }

  if (isMobile) {
    return (
      <div className="-m-4 flex min-h-screen flex-col bg-muted/10 p-4 pb-20 md:-m-8">
        {!selectedSport ? (
          <div className="space-y-6">
            <div className="space-y-4">
              <h1 className="text-xl font-black uppercase text-foreground">Cấu hình môn thi đấu</h1>
              {renderStats()}
            </div>
            <div className="h-[500px]">{renderSportList()}</div>
            <SportsCharts usageData={usageData} formatData={formatData} />
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <Button variant="ghost" className="mb-4 self-start pl-0 text-muted-foreground" onClick={() => setSelectedSportId(null)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại danh sách
            </Button>
            <SportDetailArea sport={selectedSport} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col space-y-6 pb-12">
      <div className="relative flex shrink-0 flex-col items-start justify-between gap-4 overflow-hidden rounded-2xl bg-header p-6 text-white shadow-lg md:flex-row md:items-end">
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/3 rounded-full bg-white/5 blur-3xl" />
        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase text-white/80">
            <span>Quản trị hệ thống</span> <span className="text-accent">&gt;</span> <span>Cấu hình môn thi</span>
          </div>
          <h1 className="mb-1 text-3xl font-black uppercase tracking-wider text-white">Cấu hình môn thi đấu</h1>
          <p className="text-sm text-white/80">Quản lý môn thể thao, hạng mục, stage và mẫu thể thức đã import từ database.</p>
        </div>
      </div>

      {renderStats()}

      <div className="flex h-[700px] flex-col gap-6 overflow-hidden lg:flex-row">
        <div className="h-full w-[320px] flex-none">{renderSportList()}</div>
        <div className="h-full min-w-0 flex-1">
          {selectedSport ? (
            <SportDetailArea sport={selectedSport} />
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border-2 border-dashed border-border bg-card text-sm font-medium text-muted-foreground">
              Vui lòng chọn một môn thể thao bên trái để xem chi tiết.
            </div>
          )}
        </div>
      </div>

      <SportsCharts usageData={usageData} formatData={formatData} />
    </div>
  );
};

export default AdminSportsConfigPage;
