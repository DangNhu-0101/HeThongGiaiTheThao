import { AlertTriangle } from "lucide-react";
import type { ScheduleMatch } from "@/types/schedule";

const ScheduleMatchCard = ({ match, onViewResult }: { match: ScheduleMatch; onViewResult: (match: ScheduleMatch) => void }) => {
  const { cardStyle, statusText } = (() => {
    switch (match.status) {
      case "scheduled":
        return { cardStyle: "bg-blue-50/50 border-l-4 border-blue-400", statusText: "text-blue-600" };
      case "completed":
        return { cardStyle: "bg-green-50/50 border-l-4 border-green-500", statusText: "text-green-600 font-bold" };
      case "live":
        return { cardStyle: "bg-red-50 border-l-4 border-red-500 shadow-sm", statusText: "text-red-600 font-bold animate-pulse" };
      case "conflict":
        return { cardStyle: "bg-yellow-50/80 border-l-4 border-yellow-500", statusText: "text-red-600 font-semibold" };
      case "final":
        return { cardStyle: "bg-gradient-to-r from-orange-400 to-orange-500 border-none text-white shadow-md", statusText: "" };
      default:
        return { cardStyle: "bg-card border border-border", statusText: "" };
    }
  })();

  const isFinal = match.status === "final";

  return (
    <div className={`mb-3 flex flex-col gap-2 rounded-md p-3 text-xs transition-all hover:shadow-md ${cardStyle}`}>
      <div className={`flex items-start justify-between ${isFinal ? "text-white" : "text-muted-foreground"}`}>
        <span className={`font-semibold ${isFinal ? "text-white" : "text-primary"}`}>
          {match.time || "Chưa xếp giờ"} - {match.venue || "Chưa xếp sân"}
        </span>
      </div>

      <div className={`font-bold ${isFinal ? "text-white" : "text-foreground"}`}>
        <p className="line-clamp-2">
          {match.teamA.name} <span className="mx-1 text-[10px] font-normal">vs</span> {match.teamB.name}
        </p>
      </div>

      <div className={`mt-1 flex items-center justify-between gap-2 ${isFinal ? "text-white/90" : "text-muted-foreground"}`}>
        <div className="flex min-w-0 items-center gap-2">
          {match.score && <span className={statusText}>{match.score}</span>}
          <span className="truncate">{match.roundInfo}</span>
        </div>

        {match.status === "live" && (
          <div className="flex shrink-0 items-center gap-1 font-bold text-red-600">
            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-red-600" /> LIVE
          </div>
        )}

        {match.status === "conflict" && (
          <div className="flex shrink-0 items-center gap-1 text-red-600" title={match.conflictReason}>
            <AlertTriangle className="h-3 w-3" />
            <span className="text-[10px]">Trùng lịch</span>
          </div>
        )}
      </div>

      {match.status === "completed" && (
        <button
          type="button"
          onClick={() => onViewResult(match)}
          className={`mt-1 rounded-md border px-3 py-1.5 text-[11px] font-bold transition-colors ${
            isFinal ? "border-white/30 text-white hover:bg-white/10" : "border-primary/25 text-primary hover:bg-primary/10"
          }`}
        >
          Xem kết quả
        </button>
      )}
    </div>
  );
};

export default ScheduleMatchCard;
