import { AlertTriangle, Clock, GripVertical, MapPin } from "lucide-react";
import type { DragEvent } from "react";
import type { ScheduleMatchRecord, VenueColumn } from "@/types/orgScheduleMgmt";

interface Props {
  venues: VenueColumn[];
  matches: ScheduleMatchRecord[];
  selectedDate: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, venue: string, date: string, time: string, order?: number) => Promise<void> | void;
}

const matchMime = "application/x-schedule-match";
const MATCH_DURATION_MINUTES = 30;

const minutesOfDay = (time?: string) => {
  if (!time) return null;
  const [hour, minute] = time.slice(0, 5).split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
};

const timeFromMinutes = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

const nextDropTime = (matches: ScheduleMatchRecord[], venueId: string, date: string) => {
  const laneEndTimes = matches
    .filter((match) => match.venue === venueId && match.date === date && match.time)
    .map((match) => {
      const start = minutesOfDay(match.time);
      return start === null ? null : start + Math.max(1, Number(match.durationMinutes || MATCH_DURATION_MINUTES));
    })
    .filter((value): value is number => value !== null);
  if (laneEndTimes.length === 0) return "08:00";
  return timeFromMinutes(Math.max(...laneEndTimes));
};

const endTimeOf = (match: ScheduleMatchRecord) => {
  if (match.endTime) return match.endTime.slice(0, 5);
  const start = minutesOfDay(match.time);
  if (start === null) return "";
  return timeFromMinutes(start + Math.max(1, Number(match.durationMinutes || MATCH_DURATION_MINUTES)));
};

const compareScheduleTime = (a: ScheduleMatchRecord, b: ScheduleMatchRecord) => {
  const aStart = minutesOfDay(a.time) ?? Number.MAX_SAFE_INTEGER;
  const bStart = minutesOfDay(b.time) ?? Number.MAX_SAFE_INTEGER;
  return aStart - bStart
    || (a.order || 0) - (b.order || 0)
    || (a.stageOrder || 0) - (b.stageOrder || 0)
    || a.code.localeCompare(b.code, "vi");
};

const hasSchedule = (match: Pick<ScheduleMatchRecord, "date" | "time" | "venue">) =>
  Boolean(match.date && match.time && match.venue);

const formatDateLabel = (value: string) => {
  const date = value ? new Date(`${value}T00:00:00`) : null;
  if (!date || Number.isNaN(date.getTime())) return value || "Chưa có ngày";
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const ScheduleBoard = ({ venues, matches, selectedDate, selectedId, onSelect, onMove }: Props) => {
  const sortedVenues = venues.filter((venue) => venue.id).sort((a, b) => a.name.localeCompare(b.name));
  const readMatchId = (event: DragEvent) => event.dataTransfer.getData(matchMime);
  const refereeLabel = (match: ScheduleMatchRecord) =>
    match.referee || (match.referees || []).map((referee) => referee.name).filter(Boolean).join(", ");

  const renderCard = (match: ScheduleMatchRecord, venueName?: string) => (
    <article
      key={match.id}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData(matchMime, match.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      onClick={() => onSelect(match.id)}
      className={`rounded-lg border bg-card p-3 shadow-sm transition-all hover:shadow-md ${
        match.status === "Conflict"
          ? "border-red-300 bg-red-50/50"
          : selectedId === match.id
            ? "border-primary ring-1 ring-primary"
            : "border-border"
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <span className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-black uppercase ${match.stageColorClass || "bg-primary/10 text-primary border-primary/20"}`}>
            {match.code}
          </span>
          <div className="truncate text-[10px] font-black uppercase text-muted-foreground" title={match.stageName || match.round}>
            {match.stageName || match.round || "Stage"}
          </div>
        </div>
        <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" />
      </div>

      <div className="mb-2 space-y-1 text-xs font-bold text-foreground">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[8px] text-secondary-foreground">{match.teamA.logo}</span>
          <span className="truncate">{match.teamA.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[8px] text-secondary-foreground">{match.teamB.logo}</span>
          <span className="truncate">{match.teamB.name}</span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-muted-foreground">
        <span className="flex items-center gap-1 rounded bg-accent/10 px-1.5 py-0.5 text-accent-foreground">
          <Clock className="h-3 w-3" /> {match.time ? `${match.time.slice(0, 5)}-${endTimeOf(match)}` : "Chưa có giờ"}
        </span>
        <span className="flex items-center gap-1 rounded bg-muted px-1.5 py-0.5">
          <MapPin className="h-3 w-3" /> {venueName || "Chưa xếp sân"}
        </span>
        <span className={`rounded px-1.5 py-0.5 ${match.status === "Live" ? "bg-red-50 text-red-600" : "bg-muted"}`}>
          {match.status === "Live" ? "Đang diễn ra" : match.publishStatus === "published" ? "Published" : "Draft"}
        </span>
      </div>
      <div
        className={`mt-2 truncate rounded px-2 py-1 text-[10px] font-bold ${
          refereeLabel(match) ? "bg-blue-50 text-blue-700" : "bg-muted text-muted-foreground"
        }`}
        title={refereeLabel(match) || "Chưa phân công"}
      >
        Trọng tài: {refereeLabel(match) || "Chưa phân công"}
      </div>

      {match.status === "Conflict" && (
        <div className="mt-2 flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700">
          <AlertTriangle className="h-3 w-3" /> {match.conflictReason || "Trùng lịch"}
        </div>
      )}
    </article>
  );

  return (
    <div className="h-full space-y-4 overflow-y-auto p-3 beautiful-scrollbar">
        <section className="rounded-xl border border-border/70 bg-muted/20 p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-black uppercase text-foreground">{formatDateLabel(selectedDate)}</h3>
            <span className="rounded-full bg-background px-2 py-1 text-[10px] font-bold text-muted-foreground">
              {matches.filter((match) => match.date === selectedDate && hasSchedule(match)).length} trận
            </span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-1 beautiful-scrollbar">
            {sortedVenues.map((venue) => {
              const laneMatches = matches
                .filter((match) => match.venue === venue.id && match.date === selectedDate && hasSchedule(match))
                .sort(compareScheduleTime);
        return (
          <div
            key={`${selectedDate}-${venue.id}`}
            className="flex min-w-[300px] w-[300px] flex-shrink-0 flex-col rounded-xl border border-border/70 bg-muted/20 p-2"
          >
            <div className={`mb-3 flex items-center justify-between rounded-lg border p-3 ${venue.isConflict ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}>
              <h3 className={`flex min-w-0 items-center gap-2 text-sm font-bold ${venue.isConflict ? "text-red-700" : "text-green-700"}`}>
                <span className={`h-2 w-2 shrink-0 rounded-full ${venue.isConflict ? "bg-red-500" : "bg-green-500"}`} />
                <span className="truncate">{venue.name}</span>
              </h3>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${venue.isConflict ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                {venue.statusText}
              </span>
            </div>

            <div
              onDragOver={(event) => {
                if (event.dataTransfer.types.includes(matchMime)) event.preventDefault();
              }}
              onDrop={(event) => {
                event.preventDefault();
                const matchId = readMatchId(event);
                const dragged = matches.find((match) => match.id === matchId);
                const time = dragged?.time || nextDropTime(matches, venue.id, selectedDate);
                if (matchId) void Promise.resolve(onMove(matchId, venue.id, selectedDate, time, laneMatches.length + 1)).catch(() => undefined);
              }}
              className="min-h-[240px] flex-1 space-y-3 rounded-lg border border-dashed border-border/70 bg-background/50 p-2"
            >
              {laneMatches.map((match) => renderCard(match, venue.name))}
              {laneMatches.length === 0 && (
                <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed border-border text-center text-xs font-bold text-muted-foreground">
                  Chưa có trận trong ngày đã chọn. Kéo trận vào cột sân này để xếp lịch.
                </div>
              )}
            </div>
          </div>
        );
            })}
          </div>
        </section>
      {matches.filter((match) => match.date === selectedDate && hasSchedule(match)).length === 0 && (
        <div className="flex min-h-60 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center text-xs font-bold text-muted-foreground">
          Chưa có trận nào đã được xếp lịch trong ngày đã chọn.
        </div>
      )}
    </div>
  );
};

export default ScheduleBoard;
