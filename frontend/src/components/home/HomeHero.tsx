import { Badge } from "@/components/ui/badge";
import { MapPin, Trophy, Activity } from "lucide-react";
import type { Tournament } from "@/pages/tournamentPage";

export function HomeHero({ tournament }: { tournament: Tournament }) {
  const startDate = tournament.timeLine?.tournamentStart 
    ? new Date(tournament.timeLine.tournamentStart).toLocaleDateString('vi-VN') 
    : 'Đang cập nhật';

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-sky-800 to-cyan-600 px-6 py-20 text-center">
      <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10 mix-blend-overlay"></div>
      <div className="relative z-10 mx-auto max-w-4xl flex flex-col items-center gap-6">
        <Badge className="bg-red-600 text-white hover:bg-red-700 uppercase tracking-widest px-4 py-1 border-none">
          {tournament.sportType?.join(' · ') || 'Pickleball'}
        </Badge>
        
        <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight drop-shadow-sm">
          {tournament.name || 'GIẢI ĐẤU PICKLEBALL 2026'}
        </h1>
        
        <p className="text-sky-200 text-lg md:text-xl font-medium tracking-wide">
          {tournament.slogan || 'Kết nối đam mê'} &nbsp;·&nbsp; {startDate}
        </p>

        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 mt-8 w-full">
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-4 rounded-2xl flex-1 min-w-[220px] max-w-[300px]">
            <Activity className="h-7 w-7 text-cyan-300" />
            <div className="text-left">
              <p className="text-xs text-sky-200 uppercase font-bold tracking-wider mb-0.5">Trạng thái</p>
              <p className="text-lg font-bold">{tournament.status === 'upcoming' ? 'Sắp diễn ra' : tournament.status === 'ongoing' ? 'Đang diễn ra' : 'Hoàn tất'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-4 rounded-2xl flex-1 min-w-[220px] max-w-[300px]">
            <Trophy className="h-7 w-7 text-yellow-300" />
            <div className="text-left">
              <p className="text-xs text-sky-200 uppercase font-bold tracking-wider mb-0.5">Tổng giải thưởng</p>
              <p className="text-lg font-bold truncate">{tournament.prizes ? 'Xem chi tiết' : 'Đang cập nhật'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-4 rounded-2xl flex-1 min-w-[220px] max-w-[300px]">
            <MapPin className="h-7 w-7 text-red-300" />
            <div className="text-left">
              <p className="text-xs text-sky-200 uppercase font-bold tracking-wider mb-0.5">Địa điểm</p>
              <p className="text-lg font-bold truncate">{tournament.venue || tournament.location || 'Đang cập nhật'}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}