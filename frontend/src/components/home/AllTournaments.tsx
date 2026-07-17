import { AlertCircle, CalendarDays, MapPin, Trophy, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/spectator.png";
import type { Tournament } from "@/types/tournament";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/libs/utils";

interface AllTournamentsProps {
  tournaments: Tournament[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const statusInfo = (tournament: Tournament) => {
  const now = Date.now();
  const registrationStart = tournament.timeLine.registrationStart?.getTime?.() || 0;
  const registrationEnd = tournament.timeLine.registrationEnd?.getTime?.() || 0;
  const tournamentStart = tournament.timeLine.tournamentStart?.getTime?.() || 0;
  const tournamentEnd = tournament.timeLine.tournamentEnd?.getTime?.() || 0;
  const registeredTeams = Number(tournament.registeredTeams || 0);
  const maxTeams = Number(tournament.maxTeams || 0);
  const hasSlots = maxTeams <= 0 || registeredTeams < maxTeams;

  if (registrationStart <= now && now <= registrationEnd && now < tournamentStart && hasSlots) {
    return { label: "Mở đăng ký", className: "bg-emerald-600 text-white" };
  }
  if (registrationStart <= now && (!tournamentEnd || now <= tournamentEnd) && tournament.status !== "completed") {
    return { label: "Đang diễn ra", className: "bg-primary text-white" };
  }
  if (tournament.status === "upcoming") return { label: "Sắp diễn ra", className: "bg-blue-600 text-white" };
  return { label: "Đã hoàn tất", className: "bg-slate-600 text-white" };
};

const formatDateTime = (date: Date) => date.toLocaleString("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const formatDateRange = (tournament: Tournament) => {
  const start = tournament.timeLine.tournamentStart;
  const end = tournament.timeLine.tournamentEnd;
  if (!start) return "Chưa cập nhật";
  const startText = formatDateTime(start);
  if (!end) return startText;
  return `${startText} - ${formatDateTime(end)}`;
};

const TournamentSkeleton = () => (
  <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
    <div className="aspect-[16/10] animate-pulse bg-muted" />
    <div className="space-y-4 p-5">
      <div className="h-6 w-4/5 animate-pulse rounded bg-muted" />
      <div className="h-4 w-full animate-pulse rounded bg-muted" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
      <div className="h-10 w-full animate-pulse rounded bg-muted" />
    </div>
  </div>
);

const AllTournaments = ({ tournaments, loading = false, error, onRetry }: AllTournamentsProps) => {
  return (
    <section id="tournaments" className="section-y page-shell">
      <div className="mb-8 grid gap-4 border-b border-border pb-5 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <span className="section-kicker">Tất cả giải đấu</span>
          <h2 className="mt-4 text-[clamp(1.75rem,4vw,2.625rem)] font-bold tracking-normal text-foreground">
            Những giải đấu đang được quan tâm
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Ưu tiên các giải đang diễn ra, sắp diễn ra và còn mở đăng ký từ dữ liệu hệ thống.
          </p>
        </div>
        <Link to="/tournaments" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Xem tất cả
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => <TournamentSkeleton key={index} />)}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto size-10 text-primary" />
          <h3 className="mt-4 text-xl font-bold text-foreground">Chưa thể tải danh sách giải đấu</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{error}</p>
          <Button onClick={onRetry} className="mt-5">Thử lại</Button>
        </div>
      ) : tournaments.length === 0 ? (
        <div className="summer-panel rounded-2xl p-10 text-center">
          <Trophy className="mx-auto size-10 text-primary" />
          <h3 className="mt-4 text-xl font-bold text-foreground">Chưa có giải đấu hiển thị</h3>
          <p className="mt-2 text-sm text-muted-foreground">Các giải mới sẽ xuất hiện tại đây khi ban tổ chức công bố.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {tournaments.map((tournament) => {
            const status = statusInfo(tournament);
            const sportName = tournament.sportType.find(Boolean) || "Thể thao";
            const location = [tournament.location?.detail, tournament.location?.district, tournament.location?.city].filter(Boolean).join(", ") || "Chưa cập nhật";
            const registeredTeams = Number(tournament.registeredTeams || 0);
            const maxTeams = Number(tournament.maxTeams || 0);

            return (
              <article
                key={tournament._id || tournament.name}
                className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-ring/35 hover:shadow-[var(--shadow-soft)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-primary-dark">
                  <img
                    src={tournament.banner || heroImage}
                    alt={tournament.banner ? tournament.name : `Ảnh đại diện môn ${sportName}`}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-dark/82 via-primary-dark/24 to-transparent" />
                  <div className={cn("absolute left-3 top-3 rounded-full px-3 py-1 font-highlight text-xs font-semibold shadow-sm", status.className)}>
                    {status.label}
                  </div>
                  <div className="absolute bottom-3 left-3 rounded-full bg-primary-dark/82 px-3 py-1 text-xs font-bold text-white shadow-sm backdrop-blur">
                    {sportName}
                  </div>
                </div>

                <div className="flex min-h-[16rem] flex-col p-5">
                  <h3 className="line-clamp-2 text-xl font-bold leading-tight text-card-foreground">{tournament.name}</h3>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{tournament.description || "Thông tin giải đấu sẽ được cập nhật từ ban tổ chức."}</p>
                  <div className="mt-5 grid gap-2 text-xs font-medium text-muted-foreground">
                    <span className="flex min-w-0 items-center gap-2">
                      <CalendarDays className="size-3.5 shrink-0 text-primary" />
                      <span>{formatDateRange(tournament)}</span>
                    </span>
                    <span className="flex min-w-0 items-center gap-2">
                      <MapPin className="size-3.5 shrink-0 text-primary" />
                      <span className="truncate">{location}</span>
                    </span>
                    <span className="flex min-w-0 items-center gap-2">
                      <UsersRound className="size-3.5 shrink-0 text-primary" />
                      <span>{registeredTeams.toLocaleString("vi-VN")}{maxTeams > 0 ? `/${maxTeams.toLocaleString("vi-VN")}` : ""} đội tham gia</span>
                    </span>
                  </div>
                  <div className="mt-auto flex justify-end border-t border-border pt-4">
                    <Link to={`/tournaments/${tournament._id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs")}>
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default AllTournaments;
