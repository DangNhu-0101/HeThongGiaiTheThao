import { AlertCircle, CalendarClock, MapPin, Radio, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import type { Match } from "@/types/tournament";
import { Button } from "@/components/ui/button";

interface UpcomingMatchesProps {
  matches: Match[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const MatchSkeleton = () => (
  <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
    <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
    <div className="mt-5 h-8 w-full animate-pulse rounded bg-muted" />
    <div className="mt-5 h-4 w-2/3 animate-pulse rounded bg-muted" />
  </div>
);

const UpcomingMatches = ({ matches, loading = false, error, onRetry }: UpcomingMatchesProps) => {
  return (
    <section className="section-y page-shell">
      <div className="mb-8 flex flex-col gap-3 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="section-kicker">Lịch thi đấu</span>
          <h2 className="mt-4 text-[clamp(1.75rem,4vw,2.625rem)] font-extrabold tracking-normal text-foreground">
            Trận đấu sắp diễn ra
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Hiển thị nhóm trận gần nhất theo thời gian đã được ban tổ chức công bố.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => <MatchSkeleton key={index} />)}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto size-10 text-primary" />
          <h3 className="mt-4 text-xl font-bold text-foreground">Chưa thể tải lịch thi đấu</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{error}</p>
          <Button onClick={onRetry} className="mt-5">Thử lại</Button>
        </div>
      ) : matches.length === 0 ? (
        <div className="summer-panel rounded-2xl p-10 text-center">
          <CalendarClock className="mx-auto size-10 text-primary" />
          <h3 className="mt-4 text-xl font-bold text-foreground">Chưa có trận đấu sắp diễn ra</h3>
          <p className="mt-2 text-sm text-muted-foreground">Lịch thi đấu sẽ được cập nhật khi ban tổ chức công bố.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {matches.map((match) => {
            const start = new Date(match.startTime);
            return (
              <Link
                key={match._id}
                to={`/matches/${match._id}`}
                className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-ring/40 hover:shadow-[var(--shadow-soft)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">
                    {match.tournamentName}
                  </span>
                  {match.status === "live" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-primary">
                      <Radio className="size-3.5" /> LIVE
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground">
                      {start.toLocaleDateString("vi-VN")} · {start.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <div className="min-w-0 text-right">
                    <p className="truncate text-base font-bold text-card-foreground">{match.teamA.name}</p>
                  </div>
                  <div className="rounded-xl bg-header px-4 py-2 text-sm font-extrabold text-white">
                    {match.status === "live" ? `${match.teamA.score || 0} - ${match.teamB.score || 0}` : "VS"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-card-foreground">{match.teamB.name}</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3 text-xs font-medium text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Trophy className="size-3.5 text-primary" />
                    {match.groupName || match.round}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-primary" />
                    {match.courtName || "Sân chưa cập nhật"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default UpcomingMatches;
