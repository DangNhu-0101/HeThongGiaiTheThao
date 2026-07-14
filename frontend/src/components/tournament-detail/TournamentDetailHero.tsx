import { Calendar, MapPin, Trophy, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { TournamentDetail } from "@/types/tournament";

const TournamentDetailHero = ({ detail }: { detail: TournamentDetail }) => {
  const registeredTeams = Math.min(detail.registeredTeams, detail.maxTeams);
  const remainingSlots = Math.max(0, detail.maxTeams - registeredTeams);
  const registrationClosed = remainingSlots === 0 || new Date(detail.timeLine.registrationEnd).getTime() < Date.now();
  const progress = Math.min(100, (registeredTeams / Math.max(1, detail.maxTeams)) * 100);
  const usesExternalRegistration = detail.registrationMode === "external" && Boolean(detail.registrationFormUrl);
  const banner = detail.banner?.trim();

  return (
    <section className="relative overflow-hidden bg-header text-white">
      <div className="absolute inset-0 z-0">
        {banner ? <img src={banner} alt={detail.name} className="h-full w-full object-cover opacity-32" /> : null}
        <div className="absolute inset-0 hero-wash" />
      </div>

      <div className="relative z-10 page-shell flex flex-col gap-8 py-12 md:flex-row md:py-20">
        <div className="flex-1 space-y-6">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase text-accent-foreground">Nổi bật</span>
            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${registrationClosed ? "border-red-400/35 bg-red-500/18 text-red-50" : "border-green-400/35 bg-green-500/18 text-green-100"}`}>
              {registrationClosed ? "Đã đóng đăng ký" : "Đang mở đăng ký"}
            </span>
            <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-bold text-white">{detail.sportType[0]}</span>
          </div>

          <h1 className="text-4xl font-black leading-tight md:text-6xl">{detail.name}</h1>
          <p className="max-w-2xl text-lg leading-8 text-subtitle">{detail.description}</p>

          <div className="flex flex-wrap gap-6 pt-4 text-sm font-medium text-subtitle">
            <div className="flex items-center gap-2"><Calendar className="size-4 text-accent" /> Từ {new Date(detail.timeLine.tournamentStart).toLocaleDateString("vi-VN")}</div>
            <div className="flex items-center gap-2"><MapPin className="size-4 text-accent" /> {detail.location.district}</div>
            <div className="flex items-center gap-2"><Users className="size-4 text-accent" /> {detail.maxTeams} đội</div>
            <div className="flex items-center gap-2"><Trophy className="size-4 text-accent" /> {detail.organizer}</div>
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
            <Button variant="outline" className="h-12 border-white/22 bg-white/10 px-8 text-base text-white hover:bg-white hover:text-header">
              Theo dõi giải đấu
            </Button>
          </div>
        </div>

        <div className="flex flex-col justify-end gap-4 md:w-1/3">
          <div className="rounded-lg border border-white/12 bg-white/12 p-5 shadow-[var(--shadow-panel)] backdrop-blur-md">
            <div className="mb-2 flex items-end justify-between">
              <span className="text-sm font-semibold">Tiến độ đăng ký</span>
              <span className="font-bold text-accent">{registeredTeams}/{detail.maxTeams} đội</span>
            </div>
            <div className="mb-2 h-2.5 w-full rounded-full bg-white/20">
              <div className="h-2.5 rounded-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs leading-5 text-subtitle">
              {registrationClosed
                ? "Đăng ký đã đóng hoặc đã đủ số đội."
                : `Còn lại ${remainingSlots} suất - Đóng cổng: ${new Date(detail.timeLine.registrationEnd).toLocaleDateString("vi-VN")}`}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TournamentDetailHero;
