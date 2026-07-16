import type { ResultMatchRecord } from "@/types/orgResultMgmt";

interface Props {
  matches: ResultMatchRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const statusClass = (status: string) => {
  if (status === "live") return "border-red-200 bg-red-50 text-red-600";
  if (["completed", "walkover", "forfeited"].includes(status)) return "border-green-200 bg-green-50 text-green-600";
  if (["paused", "postponed", "awaiting_confirmation"].includes(status)) return "border-orange-200 bg-orange-50 text-orange-600";
  if (status === "cancelled") return "border-slate-200 bg-slate-50 text-slate-600";
  return "border-border bg-muted text-muted-foreground";
};

const ResultMatchList = ({ matches, selectedId, onSelect }: Props) => {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-muted/20 px-4 py-3">
        <p className="text-xs font-bold uppercase text-muted-foreground">Danh sách trận</p>
        <p className="text-[11px] font-semibold text-muted-foreground">{matches.length} trận theo bộ lọc hiện tại</p>
      </div>

      <div className="beautiful-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {matches.map((match) => (
          <button
            type="button"
            key={match.id}
            onClick={() => onSelect(match.id)}
            className={`w-full rounded-xl border p-3 text-left transition-all ${selectedId === match.id ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-background hover:border-primary/50"}`}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className={`rounded border px-2 py-0.5 text-[9px] font-bold uppercase ${statusClass(match.status)}`}>
                {match.statusLabel || match.status}
              </span>
              <span className="text-[10px] font-bold text-primary">{match.matchCode}</span>
            </div>

            <div className="mb-3 flex items-center justify-between gap-2 text-xs font-semibold text-muted-foreground">
              <span className="truncate">{match.round}</span>
              <span className="truncate">{match.time || "Chưa có giờ"} - {match.venue}</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className={`truncate text-sm font-bold ${selectedId === match.id ? "text-foreground" : "text-muted-foreground"}`}>{match.teamA.name}</span>
                <span className="text-lg font-bold">{match.status === "pending" ? "-" : match.teamA.score}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className={`truncate text-sm font-bold ${selectedId === match.id ? "text-foreground" : "text-muted-foreground"}`}>{match.teamB.name}</span>
                <span className="text-lg font-bold">{match.status === "pending" ? "-" : match.teamB.score}</span>
              </div>
            </div>
          </button>
        ))}
        {matches.length === 0 && (
          <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-border p-4 text-center text-xs font-bold text-muted-foreground">
            Không có trận nào phù hợp bộ lọc.
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultMatchList;
