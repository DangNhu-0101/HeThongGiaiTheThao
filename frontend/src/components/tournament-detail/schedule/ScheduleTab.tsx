import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Trophy } from "lucide-react";
import ScheduleHeader, { type ScheduleStatusFilter, type ScheduleViewMode } from "./ScheduleHeader";
import WeeklyCalendar from "./WeeklyCalendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useScheduleStore } from "@/stores/useScheduleStore";
import type { CalendarDay, ScheduleMatch } from "@/types/schedule";

const MATCH_DURATION_MINUTES = 90;

const dateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const startOfWeek = (date: Date) => addDays(date, -((date.getDay() + 6) % 7));

const buildDays = (selectedDate: Date, viewMode: ScheduleViewMode): CalendarDay[] => {
  const today = dateKey(new Date());
  const start = viewMode === "week"
    ? startOfWeek(selectedDate)
    : viewMode === "month"
      ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
      : new Date(selectedDate);
  const length = viewMode === "week"
    ? 7
    : viewMode === "month"
      ? new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate()
      : 1;

  return Array.from({ length }, (_, index) => {
    const current = addDays(start, index);
    const key = dateKey(current);
    return {
      date: current,
      dateString: key,
      dayOfWeek: current.getDay() === 0 ? "CN" : `T${current.getDay() + 1}`,
      dayOfMonth: current.getDate(),
      isToday: key === today,
    };
  });
};

const getRangeTitle = (selectedDate: Date, viewMode: ScheduleViewMode) => {
  if (viewMode === "day") {
    return selectedDate.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
  }
  if (viewMode === "month") {
    return selectedDate.toLocaleDateString("vi-VN", { month: "long", year: "numeric" });
  }
  const start = startOfWeek(selectedDate);
  const end = addDays(start, 6);
  return `${start.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })} - ${end.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}`;
};

const sameSlot = (match: ScheduleMatch) => (match.date && match.time ? `${match.date} ${match.time}` : "");

const findConflictReason = (match: ScheduleMatch, matches: ScheduleMatch[]) => {
  const slot = sameSlot(match);
  if (!slot) return "";
  const others = matches.filter((item) => item.id !== match.id && sameSlot(item) === slot);
  if (match.courtId && others.some((item) => item.courtId && item.courtId === match.courtId)) return "Trùng sân trong cùng khung giờ";
  if ((match.refereeIds || []).some((id) => others.some((item) => (item.refereeIds || []).includes(id)))) return "Trùng trọng tài trong cùng khung giờ";
  const teamIds = [match.teamA.id, match.teamB.id].filter(Boolean);
  if (teamIds.some((id) => others.some((item) => item.teamA.id === id || item.teamB.id === id))) return "Trùng đội thi đấu trong cùng khung giờ";
  return "";
};

const withConflictStatus = (matches: ScheduleMatch[]) =>
  matches.map((match) => {
    const conflictReason = findConflictReason(match, matches);
    return conflictReason ? { ...match, status: "conflict" as const, conflictReason } : match;
  });

const getMatchStart = (match: ScheduleMatch) => {
  const date = match.startTime ? new Date(match.startTime) : match.date && match.time ? new Date(`${match.date}T${match.time}`) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

const matchesStatus = (match: ScheduleMatch, filter: ScheduleStatusFilter) => {
  if (filter === "all") return true;
  if (filter === "conflict") return match.status === "conflict";
  if (filter === "completed") return match.status === "completed" || match.status === "final";
  if (filter === "live") {
    if (match.status === "live") return true;
    const start = getMatchStart(match);
    if (!start || match.status === "completed" || match.status === "final") return false;
    const now = Date.now();
    return start.getTime() <= now && now < start.getTime() + MATCH_DURATION_MINUTES * 60 * 1000;
  }
  if (filter === "upcoming") {
    const start = getMatchStart(match);
    return Boolean(start && start.getTime() > Date.now() && match.status !== "completed" && match.status !== "final");
  }
  return true;
};

const sortSchedule = (matches: ScheduleMatch[]) =>
  [...matches].sort((a, b) => `${a.date} ${a.time} ${a.venue}`.localeCompare(`${b.date} ${b.time} ${b.venue}`, "vi"));

const ScheduleTab = ({ tournamentId }: { tournamentId: string }) => {
  const { matches, loading, error, fetchSchedule } = useScheduleStore();
  const [statusFilter, setStatusFilter] = useState<ScheduleStatusFilter>("all");
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("day");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [resultMatch, setResultMatch] = useState<ScheduleMatch | null>(null);

  useEffect(() => {
    void fetchSchedule(tournamentId);
  }, [tournamentId, fetchSchedule]);

  useEffect(() => {
    const refresh = (event: Event) => {
      const syncedTournamentId = (event as CustomEvent<{ tournamentItemId?: string }>).detail?.tournamentItemId;
      if (!syncedTournamentId || syncedTournamentId === tournamentId) void fetchSchedule(tournamentId);
    };
    window.addEventListener("tournament-result-synced", refresh);
    return () => window.removeEventListener("tournament-result-synced", refresh);
  }, [fetchSchedule, tournamentId]);

  const days = useMemo(() => buildDays(selectedDate, viewMode), [selectedDate, viewMode]);
  const daySet = useMemo(() => new Set(days.map((day) => day.dateString)), [days]);
  const filteredMatches = useMemo(() => {
    const conflicted = withConflictStatus(matches);
    return sortSchedule(conflicted.filter((match) => daySet.has(match.date) && matchesStatus(match, statusFilter)));
  }, [daySet, matches, statusFilter]);

  const moveRange = (direction: -1 | 1) => {
    if (viewMode === "month") {
      setSelectedDate((date) => new Date(date.getFullYear(), date.getMonth() + direction, 1));
      return;
    }
    const step = viewMode === "day" ? 1 : 7;
    setSelectedDate((date) => addDays(date, direction * step));
  };

  if (loading) {
    return <div className="animate-pulse py-20 text-center font-medium text-muted-foreground">Đang tải lịch thi đấu...</div>;
  }

  if (error) {
    return (
      <div className="py-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
          <AlertTriangle className="mx-auto h-8 w-8" />
          <p className="mt-3 font-bold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <ScheduleHeader
        status={statusFilter}
        viewMode={viewMode}
        title={getRangeTitle(selectedDate, viewMode)}
        onStatusChange={setStatusFilter}
        onViewModeChange={setViewMode}
        onToday={() => setSelectedDate(new Date())}
        onPrevious={() => moveRange(-1)}
        onNext={() => moveRange(1)}
      />
      <WeeklyCalendar days={days} matches={filteredMatches} onViewResult={setResultMatch} />

      <Dialog open={Boolean(resultMatch)} onOpenChange={(open) => !open && setResultMatch(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Kết quả trận đấu</DialogTitle>
            <DialogDescription>{resultMatch?.roundInfo || "Vòng đấu"}</DialogDescription>
          </DialogHeader>
          {resultMatch && (
            <div className="space-y-5">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-xl bg-muted/40 p-4">
                <div className="flex flex-col items-center gap-2 text-center">
                  <Avatar className="size-14">
                    <AvatarImage src={resultMatch.teamA.logoUrl} alt={resultMatch.teamA.name} />
                    <AvatarFallback>{resultMatch.teamA.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="line-clamp-2 text-sm font-bold">{resultMatch.teamA.name}</span>
                </div>
                <div className="text-center">
                  <div className="rounded-lg bg-header px-5 py-3 text-2xl font-black text-white">
                    {resultMatch.score || "Chưa có tỉ số"}
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2 text-center">
                  <Avatar className="size-14">
                    <AvatarImage src={resultMatch.teamB.logoUrl} alt={resultMatch.teamB.name} />
                    <AvatarFallback>{resultMatch.teamB.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="line-clamp-2 text-sm font-bold">{resultMatch.teamB.name}</span>
                </div>
              </div>

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-lg border border-border p-3">
                  <span className="text-xs font-bold uppercase text-muted-foreground">Kết quả</span>
                  <p className="mt-1 flex items-center gap-2 font-bold">
                    <Trophy className="h-4 w-4 text-accent" />
                    {resultMatch.isDraw ? "Hòa" : resultMatch.winnerName || "Chưa xác định đội thắng"}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <span className="text-xs font-bold uppercase text-muted-foreground">Thời gian và sân</span>
                  <p className="mt-1 font-bold">{resultMatch.date || "Chưa cập nhật"} {resultMatch.time || ""} · {resultMatch.venue || "Chưa cập nhật"}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <span className="text-xs font-bold uppercase text-muted-foreground">Trạng thái</span>
                  <p className="mt-1 font-bold">{resultMatch.resultStatus === "confirmed" ? "Đã xác nhận" : "Đã hoàn tất"}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <span className="text-xs font-bold uppercase text-muted-foreground">Tỉ số từng set/game</span>
                  <p className="mt-1 font-bold">{resultMatch.setScores?.length ? resultMatch.setScores.join(", ") : "Chưa cập nhật"}</p>
                </div>
              </div>

              {resultMatch.note && (
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                  <span className="text-xs font-bold uppercase text-muted-foreground">Ghi chú</span>
                  <p className="mt-1">{resultMatch.note}</p>
                </div>
              )}
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setResultMatch(null)}>Đóng</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScheduleTab;
