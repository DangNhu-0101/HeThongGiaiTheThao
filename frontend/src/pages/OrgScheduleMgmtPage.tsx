import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, CalendarClock, Clock, MapPinned, Rocket, Send, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScheduleStats from "@/components/org/schedule-mgmt/ScheduleStats";
import AssignmentEditor from "@/components/org/schedule-mgmt/AssignmentEditor";
import ScheduleBoard from "@/components/org/schedule-mgmt/ScheduleBoard";
import RequireTournamentSelection from "@/components/org/RequireTournamentSelection";
import { useOrgScheduleMgmtStore } from "@/stores/useOrgScheduleMgmtStore";
import { useOrgContextStore } from "@/stores/useOrgContextStore";
import { useIsMobile } from "@/hooks/use-mobile";

const defaultStartAt = () => {
  const date = new Date();
  date.setHours(8, 0, 0, 0);
  return date.toISOString().slice(0, 16);
};

const todayInputValue = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const OrgScheduleMgmtPage = () => {
  const isMobile = useIsMobile();
  const selectedTournamentItemId = useOrgContextStore((state) => state.selectedTournamentItemId);
  const {
    venues,
    referees,
    stages,
    matches,
    needsGroupSetup,
    selectedStageId,
    selectedMatchId,
    savingMatchIds,
    loading,
    fetchData,
    setSelectedMatchId,
    updateMatchAssignment,
    moveMatchToVenue,
    moveMatchToUnscheduled,
    autoScheduleStage,
    quickAssignVenues,
    quickAssignReferees,
    publishScheduledMatches,
  } = useOrgScheduleMgmtStore();
  const [autoOpen, setAutoOpen] = useState(false);
  const [autoStartAt, setAutoStartAt] = useState(defaultStartAt);
  const [autoInterval, setAutoInterval] = useState(30);
  const [scheduleDate, setScheduleDate] = useState(todayInputValue);
  const [unscheduledStageFilter, setUnscheduledStageFilter] = useState("");
  const [scheduledStageFilter, setScheduledStageFilter] = useState("");
  const [working, setWorking] = useState(false);

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

  const selectedStage = stages.find((stage) => stage.id === selectedStageId) || stages[0];
  const stageMatches = useMemo(
    () => matches.filter((match) => !selectedStage?.id || match.stageId === selectedStage.id),
    [matches, selectedStage?.id],
  );
  const selectedMatchAny = matches.find((match) => match.id === selectedMatchId);
  const unscheduled = matches.filter((match) => match.status === "Unscheduled" && (!unscheduledStageFilter || match.stageId === unscheduledStageFilter));
  const scheduledMatches = matches.filter((match) =>
    match.status !== "Unscheduled"
    && match.date === scheduleDate
    && (!scheduledStageFilter || match.stageId === scheduledStageFilter)
  );
  const conflicts = stageMatches.filter((match) => match.status === "Conflict");
  const stageStats = useMemo(() => {
    const scheduled = stageMatches.filter((match) => match.status === "Scheduled" || match.status === "Live").length;
    const assignedReferees = new Set(stageMatches.flatMap((match) => match.refereeIds || [])).size;
    return [
      { id: "total", label: "Tong tran", value: stageMatches.length, iconType: "total" as const, color: "text-blue-600 bg-blue-100" },
      { id: "scheduled", label: "Đã xếp lịch", value: scheduled, iconType: "scheduled" as const, color: "text-green-600 bg-green-100" },
      { id: "unscheduled", label: "Chưa xếp", value: unscheduled.length, iconType: "unscheduled" as const, color: "text-amber-600 bg-amber-100" },
      { id: "conflict", label: "Xung dot", value: conflicts.length, iconType: "conflict" as const, color: "text-red-600 bg-red-100" },
      { id: "referee", label: "Trọng tài", value: assignedReferees, iconType: "referee" as const, color: "text-purple-600 bg-purple-100" },
    ];
  }, [conflicts.length, stageMatches, unscheduled.length]);

  const runAutoSchedule = async () => {
    if (!selectedStage?.id) return;
    setWorking(true);
    try {
      await autoScheduleStage(selectedStage.id, autoStartAt, autoInterval);
      setAutoOpen(false);
    } finally {
      setWorking(false);
    }
  };

  const publishCurrentStage = async () => {
    if (!selectedTournamentItemId) return;
    const allConflicts = matches.filter((match) => match.status === "Conflict");
    if (allConflicts.length > 0 && !window.confirm("Lich dang co xung dot san/gio. Ban van muon công bố cac trận da xếp lịch?")) return;
    setWorking(true);
    try {
      await publishScheduledMatches(selectedTournamentItemId);
    } finally {
      setWorking(false);
    }
  };

  const runQuickVenueAssign = async () => {
    if (!selectedStage?.id) return;
    setWorking(true);
    try {
      await quickAssignVenues(selectedStage.id, scheduleDate);
    } finally {
      setWorking(false);
    }
  };

  const runQuickRefereeAssign = async () => {
    if (!selectedStage?.id) return;
    setWorking(true);
    try {
      await quickAssignReferees(selectedStage.id);
    } finally {
      setWorking(false);
    }
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center font-medium text-muted-foreground animate-pulse">Đang tải dữ liệu xếp lịch...</div>;
  }

  if (!selectedTournamentItemId) {
    return <RequireTournamentSelection description="Hay chon giai o Sidebar de quan ly lịch thi đấu va phan cong cua giai do." />;
  }

  if (needsGroupSetup) {
    return (
      <div className="mx-auto max-w-[1600px] space-y-6 pb-12">
        <HeaderPanel title="Trận & Lịch" subtitle="Trang nay chi xep san, gio va công bố lich sau khi thể thức da co slot doi." />
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center shadow-sm">
          <h2 className="text-lg font-black text-foreground">Chưa có match de xếp lịch</h2>
          <p className="mt-2 text-sm font-semibold text-muted-foreground">
            Hay vao trang Thể thức thi dau, tab Gán đội / Seed de keo doi vao bang hoac slot knockout, sau do sinh match that roi quay lai xếp lịch.
          </p>
        </div>
      </div>
    );
  }

  if (stageMatches.length === 0) {
    return (
      <div className="flex h-full items-center justify-center font-medium text-muted-foreground">
        Chưa có trận đấu cho stage dang chon.
      </div>
    );
  }

  if (isMobile && selectedMatchAny) {
    return (
      <div className="flex min-h-screen flex-col -m-4 bg-muted/10 p-4 pb-20 md:-m-8">
        <Button variant="ghost" className="mb-4 self-start pl-0 text-muted-foreground" onClick={() => setSelectedMatchId(null)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
        </Button>
        <AssignmentEditor match={selectedMatchAny} venues={venues} referees={referees} saving={savingMatchIds.includes(selectedMatchAny.id)} onSave={updateMatchAssignment} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col space-y-6 pb-12">
      <HeaderPanel title="Lịch thi đấu & Phan cong" subtitle="Xếp lịch theo tung stage, keo tha giua cac san, auto schedule va công bố lich." />

      <div className="space-y-4">
        <StageToolbar
          selectedStageId={selectedStage?.id || null}
          working={working}
          onAuto={() => setAutoOpen(true)}
          onQuickVenues={runQuickVenueAssign}
          onQuickReferees={runQuickRefereeAssign}
          onPublish={publishCurrentStage}
        />
        <ScheduleStats stats={stageStats} />
      </div>

      {conflicts.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700 shadow-sm">
          <AlertTriangle className="h-4 w-4" />
          {conflicts.length} trận dang trung sân va gio trong stage nay. Hay doi gio/sân hoac xac nhan khi công bố.
        </div>
      )}

      <div
        onDragOver={(event) => {
          if (event.dataTransfer.types.includes("application/x-schedule-match")) event.preventDefault();
        }}
        onDrop={(event) => {
          event.preventDefault();
          const matchId = event.dataTransfer.getData("application/x-schedule-match");
          if (matchId) void moveMatchToUnscheduled(matchId).catch(() => undefined);
        }}
        className="sticky top-0 z-20 rounded-xl border border-border bg-card/95 p-4 shadow-sm backdrop-blur"
      >
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-orange-100 text-orange-600">
            <Clock className="h-3.5 w-3.5" />
          </div>
          <h4 className="text-sm font-bold text-foreground">Trận chưa xếp lịch</h4>
          <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-600">{unscheduled.length} tran</span>
          <span className="text-[10px] font-semibold text-muted-foreground">Keo trận vao day de xoa sân va gio</span>
          <StageFilter stages={stages} value={unscheduledStageFilter} onChange={setUnscheduledStageFilter} className="ml-auto" />
        </div>
        <div
          className={`flex min-h-14 gap-3 overflow-x-auto rounded-lg border border-dashed p-2 beautiful-scrollbar ${
            unscheduled.length > 0 ? "border-orange-200 bg-orange-50/40" : "border-border bg-muted/20"
          }`}
        >
          {unscheduled.map((match) => (
            <button
              key={match.id}
              type="button"
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData("application/x-schedule-match", match.id);
                event.dataTransfer.effectAllowed = "move";
              }}
              onClick={() => setSelectedMatchId(match.id)}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${selectedMatchId === match.id ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:bg-muted"}`}
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-muted text-[8px] shadow-sm">{match.teamA.logo}</span>
              {match.code}: {match.teamA.name} vs {match.teamB.name}
            </button>
          ))}
          {unscheduled.length === 0 && (
            <div className="flex min-h-9 items-center px-2 text-xs font-bold text-muted-foreground">
              Tat ca trận cua stage nay da duoc xếp lịch.
            </div>
          )}
        </div>
      </div>

      <div className="flex h-[760px] flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-border bg-background shadow-sm">
          <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
            <span className="text-xs font-black uppercase text-muted-foreground">Ngay xếp lịch</span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={scheduleDate}
                onChange={(event) => setScheduleDate(event.target.value || todayInputValue())}
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm font-bold text-foreground shadow-sm outline-none transition focus:border-primary"
              />
              <StageFilter stages={stages} value={scheduledStageFilter} onChange={setScheduledStageFilter} />
            </div>
          </div>
          <ScheduleBoard
            venues={venues}
            matches={scheduledMatches}
            selectedDate={scheduleDate}
            selectedId={selectedMatchId}
            onSelect={setSelectedMatchId}
            onMove={moveMatchToVenue}
          />
        </div>
        <div className="flex w-full flex-none flex-col gap-6 overflow-y-auto beautiful-scrollbar pb-6 lg:w-[340px] lg:pr-2">
          {selectedMatchAny ? (
            <AssignmentEditor match={selectedMatchAny} venues={venues} referees={referees} saving={savingMatchIds.includes(selectedMatchAny.id)} onSave={updateMatchAssignment} />
          ) : (
            <div className="rounded-xl border-2 border-dashed border-border bg-card p-6 text-center text-sm font-medium text-muted-foreground">
              Chọn mot trận de sua gio, sân hoac thu tu.
            </div>
          )}
        </div>
      </div>

      {autoOpen && selectedStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl">
            <div className="mb-4">
              <p className="text-xs font-black uppercase text-primary">Stage hiện tại</p>
              <h3 className="text-lg font-black text-foreground">{selectedStage.name}</h3>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">Auto se ghi de san/gio theo thuat toan, khong tao them match va khong doi kết quả.</p>
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase text-muted-foreground">
                Thời gian bat dau
                <input
                  type="datetime-local"
                  value={autoStartAt}
                  onChange={(event) => setAutoStartAt(event.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm font-semibold text-foreground"
                />
              </label>
              <label className="block text-xs font-bold uppercase text-muted-foreground">
                Khoang cach giua 2 dot trận (phut)
                <input
                  type="number"
                  min={1}
                  value={autoInterval}
                  onChange={(event) => setAutoInterval(Number(event.target.value) || 30)}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm font-semibold text-foreground"
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAutoOpen(false)} disabled={working}>Hủy</Button>
              <Button onClick={runAutoSchedule} disabled={working}>
                <Rocket className="h-4 w-4" /> {working ? "Đang xếp..." : "Xếp lịch tu dong"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const HeaderPanel = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="relative flex shrink-0 flex-col items-start justify-between gap-4 overflow-hidden rounded-2xl bg-header p-6 text-white shadow-lg md:flex-row md:items-end">
    <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/3 rounded-full bg-white/5 blur-3xl" />
    <div className="relative z-10">
      <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase text-white/70">
        <span>Cổng tổ chức</span>
        <span className="text-accent">&gt;</span>
        <span>Quan ly trận đấu</span>
      </div>
      <h1 className="mb-1 text-3xl font-black uppercase tracking-wider">{title}</h1>
      <p className="text-sm text-white/70">{subtitle}</p>
    </div>
  </div>
);

const StageFilter = ({
  stages,
  value,
  onChange,
  className = "",
}: {
  stages: Array<{ id: string; name: string; order: number }>;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) => (
  <select
    value={value}
    onChange={(event) => onChange(event.target.value)}
    className={`h-8 min-w-[160px] rounded-lg border border-border bg-background px-2 text-xs font-bold text-foreground focus:outline-none ${className}`}
  >
    <option value="">Tất cả Stage</option>
    {stages.map((stage) => (
      <option key={stage.id} value={stage.id}>Stage {stage.order}</option>
    ))}
  </select>
);

interface StageToolbarProps {
  selectedStageId: string | null;
  working: boolean;
  onAuto: () => void;
  onQuickVenues: () => void;
  onQuickReferees: () => void;
  onPublish: () => void;
}

const StageToolbar = ({ selectedStageId, working, onAuto, onQuickVenues, onQuickReferees, onPublish }: StageToolbarProps) => {
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={onAuto} disabled={!selectedStageId || working}>
            <CalendarClock className="h-4 w-4" /> Xếp lịch tu dong
          </Button>
          <Button type="button" variant="outline" onClick={onQuickVenues} disabled={!selectedStageId || working}>
            <MapPinned className="h-4 w-4" /> Phan sân nhanh
          </Button>
          <Button type="button" variant="outline" onClick={onQuickReferees} disabled={!selectedStageId || working}>
            <UserCheck className="h-4 w-4" /> Phan trọng tài nhanh
          </Button>
          <Button type="button" onClick={onPublish} disabled={working}>
            <Send className="h-4 w-4" /> Công bố lich da xep
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrgScheduleMgmtPage;
