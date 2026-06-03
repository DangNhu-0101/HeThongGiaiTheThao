import { Badge } from "@/components/ui/badge";
import type { Tournament } from "@/pages/tournamentPage";
import { CalendarDays, Info, MapPin } from "lucide-react";

const formatDate = (value?: string) => {
  if (!value) return "Đang cập nhật";
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  });
};

const formatTime = (value?: string) => {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  });
};

const getStatusLabel = (status?: Tournament["status"]) => {
  switch (status) {
    case "upcoming":
      return "Sắp diễn ra";
    case "ongoing":
    case "playing":
    case "Actived":
      return "Đang diễn ra";
    case "completed":
      return "Hoàn tất";
    case "cancelled":
      return "Đã hủy";
    default:
      return "Đang cập nhật";
  }
};

export function HomeHero({ tournament }: { tournament: Tournament }) {
  const tournamentDate = formatDate(tournament.timeLine?.tournamentStart);
  const startTime = formatTime(tournament.timeLine?.tournamentStart);
  const endTime = formatTime(tournament.timeLine?.tournamentEnd);
  const timeRange = startTime && endTime ? `${startTime} - ${endTime}` : startTime || "Đang cập nhật";

  return (
    <section className="relative overflow-hidden bg-slate-950 px-6 py-16 text-center sm:py-20">
      {tournament.bannerUrl ? (
        <img
          src={`http://localhost:5001/${tournament.bannerUrl.replace(/\\/g, "/").replace(/^\/+/, "")}`}
          alt={tournament.name}
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-sky-950/85 to-cyan-800/75" />

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center gap-6">
        <Badge className="border-none bg-cyan-500 px-4 py-1 text-white hover:bg-cyan-600">
          {tournament.sportType?.join(" · ") || "Pickleball"}
        </Badge>

          <div className="flex flex-col items-center justify-center space-y-3 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-100">
            {tournament.organization?.orgName || tournament.organization?.name || "Ban tổ chức"}
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-white text-center drop-shadow md:text-6xl">
            {tournament.displayName || tournament.name || "Giải đấu"}
          </h1>
          {tournament.slogan ? (
            <p className="mx-auto max-w-3xl text-lg font-medium leading-relaxed text-center text-cyan-50 md:text-xl">
              {tournament.slogan}
            </p>
          ) : null}
        </div>
        <div className="mt-4 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-xl border border-white/20 bg-white/10 px-5 py-4 text-left text-white backdrop-blur-md">
            <div className="rounded-lg bg-white/20 p-2">
              <Info className="h-5 w-5 text-cyan-100" />
            </div>
            <div>
              <p className="mb-0.5 text-xs font-bold uppercase tracking-wider text-cyan-100">Trạng thái</p>
              <p className="text-base font-bold">{getStatusLabel(tournament.status)}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-white/20 bg-white/10 px-5 py-4 text-left text-white backdrop-blur-md">
            <div className="rounded-lg bg-white/20 p-2">
              <CalendarDays className="h-5 w-5 text-cyan-100" />
            </div>
            <div>
              <p className="mb-0.5 text-xs font-bold uppercase tracking-wider text-cyan-100">Thời gian thi đấu</p>
              <p className="text-base font-bold">{tournamentDate} | {timeRange}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-white/20 bg-white/10 px-5 py-4 text-left text-white backdrop-blur-md">
            <div className="rounded-lg bg-white/20 p-2">
              <MapPin className="h-5 w-5 text-cyan-100" />
            </div>
            <div>
              <p className="mb-0.5 text-xs font-bold uppercase tracking-wider text-cyan-100">Địa điểm</p>
              <p className="line-clamp-2 text-base font-bold">{tournament.venue || tournament.location || "Đang cập nhật"}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}