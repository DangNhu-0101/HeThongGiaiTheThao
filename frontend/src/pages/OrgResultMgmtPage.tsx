import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ResultStats from "@/components/org/result-mgmt/ResultStats";
import ResultMatchList from "@/components/org/result-mgmt/ResultMatchList";
import ResultEditor from "@/components/org/result-mgmt/ResultEditor";
import RequireTournamentSelection from "@/components/org/RequireTournamentSelection";
import { useOrgResultMgmtStore } from "@/stores/useOrgResultMgmtStore";
import { useOrgContextStore } from "@/stores/useOrgContextStore";
import { useIsMobile } from "@/hooks/use-mobile";

const emptyFilters = {
  status: "",
  stageId: "",
  groupName: "",
  date: "",
  courtId: "",
  tag: "",
};

const OrgResultMgmtPage = () => {
  const isMobile = useIsMobile();
  const selectedTournamentItemId = useOrgContextStore((state) => state.selectedTournamentItemId);
  const {
    stats,
    matches,
    stages,
    statusTags,
    selectedMatchId,
    savingMatchIds,
    loading,
    error,
    fetchData,
    setSelectedMatchId,
    updateScore,
    saveLiveScore,
    updateStatus,
    confirmResult,
  } = useOrgResultMgmtStore();
  const [filters, setFilters] = useState(emptyFilters);

  useEffect(() => {
    if (!selectedTournamentItemId) return;
    fetchData(selectedTournamentItemId);
  }, [fetchData, selectedTournamentItemId]);

  useEffect(() => {
    if (!selectedTournamentItemId) return;
    const timer = window.setInterval(() => {
      void fetchData(selectedTournamentItemId, true);
    }, 30000);
    return () => window.clearInterval(timer);
  }, [fetchData, selectedTournamentItemId]);

  const filteredMatches = useMemo(() => matches.filter((match) => {
    if (filters.status && match.status !== filters.status) return false;
    if (filters.stageId && match.stageId !== filters.stageId) return false;
    if (filters.groupName && match.groupName !== filters.groupName) return false;
    if (filters.date && match.date !== filters.date) return false;
    if (filters.courtId && match.courtId !== filters.courtId) return false;
    if (filters.tag && !(match.tags || []).includes(filters.tag)) return false;
    return true;
  }), [filters, matches]);

  useEffect(() => {
    if (!isMobile && filteredMatches.length > 0 && !selectedMatchId) {
      setSelectedMatchId(filteredMatches[0].id);
    }
  }, [filteredMatches, isMobile, selectedMatchId, setSelectedMatchId]);

  const selectedMatch = matches.find((match) => match.id === selectedMatchId);
  const options = useMemo(() => {
    const groups = Array.from(new Set(matches.map((match) => match.groupName || "").filter(Boolean)));
    const dates = Array.from(new Set(matches.map((match) => match.date || "").filter(Boolean))).sort();
    const courts = Array.from(new Map(matches.filter((match) => match.courtId).map((match) => [match.courtId, match.venue])).entries());
    const tags = Array.from(new Set(matches.flatMap((match) => match.tags || [])));
    return { groups, dates, courts, tags };
  }, [matches]);

  if (loading) {
    return <div className="flex h-full items-center justify-center font-medium text-muted-foreground animate-pulse">Đang tải dữ liệu kết quả...</div>;
  }

  if (!selectedTournamentItemId) {
    return <RequireTournamentSelection description="Hãy chọn giải ở sidebar để cập nhật kết quả của giải đó." />;
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
          <AlertTriangle className="mx-auto h-8 w-8" />
          <p className="mt-3 font-bold">{error}</p>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return <div className="flex h-full items-center justify-center font-medium text-muted-foreground">Chưa có trận đấu thật cho giải đã chọn.</div>;
  }

  const filtersPanel = (
    <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-card p-3 shadow-sm md:grid-cols-3 xl:grid-cols-6">
      <FilterSelect label="Trạng thái" value={filters.status} onChange={(status) => setFilters((current) => ({ ...current, status }))}>
        {statusTags.map((tag) => <option key={tag.value} value={tag.value}>{tag.label}</option>)}
      </FilterSelect>
      <FilterSelect label="Stage" value={filters.stageId} onChange={(stageId) => setFilters((current) => ({ ...current, stageId }))}>
        {stages.map((stage) => <option key={stage.id} value={stage.id}>Stage {stage.order} - {stage.name}</option>)}
      </FilterSelect>
      <FilterSelect label="Bảng" value={filters.groupName} onChange={(groupName) => setFilters((current) => ({ ...current, groupName }))}>
        {options.groups.map((group) => <option key={group} value={group}>{group}</option>)}
      </FilterSelect>
      <FilterSelect label="Ngày" value={filters.date} onChange={(date) => setFilters((current) => ({ ...current, date }))}>
        {options.dates.map((date) => <option key={date} value={date}>{date}</option>)}
      </FilterSelect>
      <FilterSelect label="Sân" value={filters.courtId} onChange={(courtId) => setFilters((current) => ({ ...current, courtId }))}>
        {options.courts.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
      </FilterSelect>
      <FilterSelect label="Tag" value={filters.tag} onChange={(tag) => setFilters((current) => ({ ...current, tag }))}>
        {options.tags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
      </FilterSelect>
    </div>
  );

  if (isMobile) {
    return (
      <div className="-m-4 flex min-h-[calc(100dvh-64px)] flex-col overflow-y-auto bg-muted/10 p-4 pb-8 md:-m-8 beautiful-scrollbar">
        {!selectedMatch ? (
          <>
            <div className="shrink-0 space-y-3">
              <h1 className="text-xl font-bold uppercase text-foreground">Cập nhật kết quả</h1>
              <ResultStats stats={stats} />
              {filtersPanel}
            </div>
            <div className="mt-4 min-h-[58dvh]">
              <ResultMatchList matches={filteredMatches} selectedId={selectedMatchId} onSelect={setSelectedMatchId} />
            </div>
          </>
        ) : (
          <div className="flex min-h-[calc(100dvh-96px)] flex-col">
            <Button variant="ghost" className="mb-4 self-start pl-0 text-muted-foreground" onClick={() => setSelectedMatchId(null)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại danh sách
            </Button>
            <ResultEditor match={selectedMatch} statusTags={statusTags} saving={savingMatchIds.includes(selectedMatch.id)} onUpdateScore={updateScore} onSaveLiveScore={saveLiveScore} onUpdateStatus={updateStatus} onConfirmResult={confirmResult} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-[1600px] flex-col space-y-6 xl:h-[calc(100vh-80px)]">
      <div className="relative flex shrink-0 flex-col items-start justify-between gap-4 overflow-hidden rounded-2xl bg-header p-6 text-white shadow-lg md:flex-row md:items-end">
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/3 rounded-full bg-white/5 blur-3xl" />
        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase text-white/70">
            <span>Cổng tổ chức</span><span className="text-accent">&gt;</span><span>Quản lý kết quả</span>
          </div>
          <h1 className="mb-1 text-3xl font-bold uppercase tracking-normal">Cập nhật kết quả trận đấu</h1>
          <p className="text-sm text-white/70">Nhập tỷ số theo thể thức đã lưu, xác nhận và đồng bộ bảng xếp hạng/knockout.</p>
        </div>
      </div>

      <div className="shrink-0 space-y-3">
        <ResultStats stats={stats} />
        {filtersPanel}
      </div>

      <div className="grid min-h-[640px] flex-1 grid-cols-[minmax(320px,0.9fr)_minmax(0,2.1fr)] gap-6">
        <div className="h-full min-h-0">
          <ResultMatchList matches={filteredMatches} selectedId={selectedMatchId} onSelect={setSelectedMatchId} />
        </div>

        <div className="h-full min-h-0">
          {selectedMatch ? (
            <ResultEditor match={selectedMatch} statusTags={statusTags} saving={savingMatchIds.includes(selectedMatch.id)} onUpdateScore={updateScore} onSaveLiveScore={saveLiveScore} onUpdateStatus={updateStatus} onConfirmResult={confirmResult} />
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground">
              Vui lòng chọn một trận đấu bên trái để cập nhật.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const FilterSelect = ({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) => (
  <label className="block text-[10px] font-black uppercase text-muted-foreground">
    {label}
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-2 text-xs font-bold normal-case text-foreground focus:outline-none"
    >
      <option value="">Tất cả</option>
      {children}
    </select>
  </label>
);

export default OrgResultMgmtPage;
