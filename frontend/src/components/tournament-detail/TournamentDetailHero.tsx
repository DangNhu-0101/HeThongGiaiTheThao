import { useEffect, useState } from "react";
import { Calendar, MapPin, Trophy, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { TournamentDetail } from "@/types/tournament";

const formatDateTime = (date: Date) => date.toLocaleString("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const TournamentDetailHero = ({ detail }: { detail: TournamentDetail }) => {
  const registeredTeams = Math.min(detail.registeredTeams, detail.maxTeams);
  const remainingSlots = Math.max(0, detail.maxTeams - registeredTeams);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    queueMicrotask(() => setNow(Date.now()));
  }, []);
  const registrationClosed = remainingSlots === 0 || (now !== null && new Date(detail.timeLine.registrationEnd).getTime() < now);
  const progress = Math.min(100, (registeredTeams / Math.max(1, detail.maxTeams)) * 100);
  const usesExternalRegistration = detail.registrationMode === "external" && Boolean(detail.registrationFormUrl);
  const banner = detail.banner?.trim();
  const location = [detail.location.detail].filter(Boolean).join(", ") || "Chưa cập nhật";

  return (
    <section className="relative isolate overflow-hidden bg-primary-dark text-white">
      {banner ? <img src={banner} alt={detail.name} className="absolute inset-0 -z-30 h-full w-full object-cover" /> : null}
      <div className="absolute inset-0 -z-20 bg-primary-dark/72" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(13,36,59,0.96)_0%,rgba(13,36,59,0.86)_48%,rgba(50,89,120,0.68)_100%)]" />

      <div className="page-shell relative z-10 flex flex-col gap-8 py-12 md:flex-row md:py-20">
        <div className="flex-1 space-y-6">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-accent px-3 py-1 font-highlight text-xs font-semibold uppercase tracking-wide text-accent-foreground">Nổi bật</span>
            <span className={`rounded-full border px-3 py-1 font-highlight text-xs font-semibold uppercase tracking-wide ${registrationClosed ? "border-white/20 bg-white/12 text-white" : "border-green-300/40 bg-green-500/20 text-green-50"}`}>
              {registrationClosed ? "Đã đóng đăng ký" : "Đang mở đăng ký"}
            </span>
            <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-bold text-white ring-1 ring-white/15">{detail.sportType[0]}</span>
          </div>

          <h1 className="max-w-4xl font-heading text-4xl font-bold leading-tight text-white md:text-6xl">{detail.name}</h1>
          <p className="max-w-2xl text-lg font-medium leading-8 text-white/84">{detail.description}</p>

          <div className="flex flex-wrap gap-6 pt-4 text-sm font-medium text-white/82">
            <div className="flex items-center gap-2"><Calendar className="size-4 text-primary-light" /> Từ {formatDateTime(new Date(detail.timeLine.tournamentStart))}</div>
            <div className="flex items-center gap-2"><MapPin className="size-4 text-primary-light" /> {location}</div>
            <div className="flex items-center gap-2"><Users className="size-4 text-primary-light" /> {detail.maxTeams} đội</div>
            <div className="flex items-center gap-2"><Trophy className="size-4 text-primary-light" /> {detail.organizer}</div>
          </div>

          <div className="flex flex-wrap gap-4 pt-4">
            {!registrationClosed && (usesExternalRegistration ? (
              <Button render={<a href={detail.registrationFormUrl} target="_blank" rel="noreferrer" />} className="h-12 px-8 text-base">
                Mở link đăng ký
              </Button>
            ) : (
              <Button render={<Link to={`/tournaments/${detail._id}/register`} />} className="h-12 px-8 text-base">
                Đăng ký trên hệ thống
              </Button>
            ))}
          
          </div>
        </div>

        <div className="flex flex-col justify-end gap-4 md:w-1/3">
          <div className="rounded-xl border border-white/14 bg-primary-dark/86 p-5 text-white shadow-[var(--shadow-panel)] backdrop-blur-md">
            <div className="mb-3 flex items-end justify-between">
              <span className="text-sm font-bold text-white">Tiến độ đăng ký</span>
              <span className="font-highlight text-lg font-semibold text-white">{registeredTeams}/{detail.maxTeams} đội</span>
            </div>
            <div className="mb-3 h-2.5 w-full rounded-full bg-white/12">
              <div className="h-2.5 rounded-full bg-accent" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs leading-5 text-white/78">
              {registrationClosed
                ? "Đăng ký đã đóng"
                : `Còn lại ${remainingSlots} suất - Đóng cổng: ${formatDateTime(new Date(detail.timeLine.registrationEnd))}`}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TournamentDetailHero;
