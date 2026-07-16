import { CheckCircle2, Clock, Trophy } from "lucide-react";
import type { MatchStatusTag, ResultMatchRecord } from "@/types/orgResultMgmt";
import { Button } from "@/components/ui/button";

interface Props {
  match: ResultMatchRecord;
  statusTags: MatchStatusTag[];
  saving?: boolean;
  onUpdateScore: (matchId: string, team: "teamA" | "teamB", delta: number) => void;
  onSaveLiveScore: (matchId: string) => Promise<void> | void;
  onUpdateStatus: (matchId: string, status: string) => void;
  onConfirmResult: (matchId: string) => Promise<void> | void;
}

const tagClass = (tone?: MatchStatusTag["tone"], active = false) => {
  const base = active ? "ring-1 ring-offset-1 " : "";
  if (tone === "danger") return `${base}border-red-200 bg-red-50 text-red-600 hover:bg-red-100`;
  if (tone === "warning") return `${base}border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100`;
  if (tone === "success") return `${base}border-green-200 bg-green-50 text-green-600 hover:bg-green-100`;
  if (tone === "info") return `${base}border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100`;
  return `${base}border-border bg-muted text-muted-foreground hover:bg-muted/80`;
};

const ResultEditor = ({ match, statusTags, saving = false, onUpdateScore, onSaveLiveScore, onUpdateStatus, onConfirmResult }: Props) => {
  const statusLabel = match.statusLabel || statusTags.find((tag) => tag.value === match.status)?.label || match.status;
  const canEditScore = match.status === "live";
  const lockedMessage = match.status === "completed"
    ? "Trận đã hoan thanh. Diem so da khoa tai man hinh nay."
    : "Chỉ trận đang diễn ra mới được nhập điểm.";

  return (
    <div className="flex h-full min-h-[620px] flex-col gap-4 pb-0">
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm md:p-8">
        <div className="mb-6 flex w-full flex-col items-start justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center md:mb-8">
          <div className="flex min-w-0 items-center gap-3 text-xs font-bold text-muted-foreground">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
              <Trophy className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-1 text-sm text-foreground">
                <span className="truncate">{match.tournamentName || match.matchCode}</span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{match.round}</span>
              </p>
              <p className="mt-0.5 truncate">{match.time || "Chưa có giờ"} - {match.venue || "Chưa có sân"} - TT: {match.referee || "Chưa phân công"}</p>
            </div>
          </div>
          <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:flex-col sm:items-end">
            <span className="shrink-0 rounded border border-border bg-muted px-2 py-1 text-[10px] font-black uppercase text-muted-foreground">
              {statusLabel}
            </span>
            <span className="flex items-center gap-1 text-sm font-bold text-primary"><Clock className="h-3 w-3" /> {match.minute || "0'"}</span>
          </div>
        </div>

        <div className="mb-6 flex w-full flex-1 items-center justify-center gap-2 sm:gap-8 md:mb-8 md:gap-20">
          <ScoreTeam match={match} side="teamA" disabled={!canEditScore || saving} onUpdateScore={onUpdateScore} />
          <div className="shrink-0 text-lg font-black text-muted-foreground md:text-2xl">VS</div>
          <ScoreTeam match={match} side="teamB" disabled={!canEditScore || saving} onUpdateScore={onUpdateScore} />
        </div>

        {!canEditScore && (
          <div className="mb-4 w-full rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs font-bold text-amber-700">
            {lockedMessage}
          </div>
        )}

        <div className="flex w-full flex-wrap items-center justify-center gap-2 border-t border-border pt-4 md:justify-start">
          {statusTags.map((tag) => (
            <Button
              key={tag.value}
              size="sm"
              variant="outline"
              disabled={saving || match.status === "completed" || tag.value === "completed"}
              onClick={() => onUpdateStatus(match.id, tag.value)}
              className={`h-8 flex-1 px-3 text-xs sm:flex-none ${tagClass(tag.tone, match.status === tag.value)}`}
            >
              {tag.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button disabled={!canEditScore || saving} variant="outline" onClick={() => onSaveLiveScore(match.id)} className="h-12 w-full text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60">
          {saving ? "Đang lưu..." : "Lưu điểm đang diễn ra"}
        </Button>
        <Button disabled={!canEditScore || saving} onClick={() => onConfirmResult(match.id)} className="h-12 w-full bg-emerald-500 text-sm font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70">
          <CheckCircle2 className="mr-2 h-4 w-4 shrink-0" /> {saving ? "Đang đồng bộ..." : "Kết thúc & đồng bộ BXH"}
        </Button>
      </div>
    </div>
  );
};

const ScoreTeam = ({
  match,
  side,
  disabled,
  onUpdateScore,
}: {
  match: ResultMatchRecord;
  side: "teamA" | "teamB";
  disabled?: boolean;
  onUpdateScore: (matchId: string, team: "teamA" | "teamB", delta: number) => void;
}) => {
  const team = match[side];
  const label = side === "teamA" ? "Đội A" : "Đội B";
  return (
    <div className="flex w-28 flex-col items-center sm:w-32 md:w-56">
      <div className="mb-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-lg font-black text-secondary-foreground shadow-sm md:mb-4 md:h-20 md:w-20 md:text-2xl">
        {team.logo}
      </div>
      <h3 className="mb-3 h-8 text-center text-xs font-bold line-clamp-2 md:mb-5 md:h-10 md:text-base">{team.name}</h3>
      <p className="mb-2 text-[10px] font-bold uppercase text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2 md:gap-4">
        <button type="button" disabled={disabled} onClick={() => onUpdateScore(match.id, side, -1)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted font-bold text-muted-foreground transition-colors hover:bg-red-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 md:h-8 md:w-8">-</button>
        <div className="flex h-16 w-14 shrink-0 items-center justify-center rounded-xl border-2 border-border bg-background text-4xl font-black text-primary shadow-inner md:h-28 md:w-24 md:text-7xl">
          {team.score}
        </div>
        <button type="button" disabled={disabled} onClick={() => onUpdateScore(match.id, side, 1)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary transition-colors hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40 md:h-8 md:w-8">+</button>
      </div>
    </div>
  );
};

export default ResultEditor;

