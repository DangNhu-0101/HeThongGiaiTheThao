import { MapPin, Users, Calendar, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TournamentDetail } from "@/types/tournament"; // Import type đúng

// Bỏ any, xài TournamentDetail
const TournamentDetailHero = ({ detail }: { detail: TournamentDetail }) => {
  const progress = (detail.registeredTeams / detail.maxTeams) * 100;

  return (
    <section className="relative bg-header text-white overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src={detail.banner} alt={detail.name} className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-header via-header/80 to-transparent"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-8 py-12 md:py-20 flex flex-col md:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <div className="flex gap-2">
            <span className="bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full uppercase">Nổi bật</span>
            <span className="bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-bold px-3 py-1 rounded-full">Đang mở đăng ký</span>
            <span className="bg-white/10 text-white text-xs font-bold px-3 py-1 rounded-full">{detail.sportType[0]}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold uppercase leading-tight">{detail.name}</h1>
          <p className="text-subtitle text-lg max-w-2xl">{detail.description}</p>
          
          <div className="flex flex-wrap gap-6 text-sm font-medium pt-4">
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-accent" /> Từ {new Date(detail.timeLine.tournamentStart).toLocaleDateString('vi-VN')}</div>
            <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-accent" /> {detail.location.district}</div>
            <div className="flex items-center gap-2"><Users className="w-4 h-4 text-accent" /> {detail.maxTeams} Đội</div>
            <div className="flex items-center gap-2"><Trophy className="w-4 h-4 text-accent" /> {detail.organizer}</div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button className="bg-primary hover:bg-primary-hover text-white px-8 py-6 text-base shadow-lg shadow-primary/20">Đăng ký Đội</Button>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-base">Theo dõi Giải đấu</Button>
          </div>
        </div>

        <div className="md:w-1/3 flex flex-col justify-end gap-4">
           <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-5">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-semibold">Tiến độ đăng ký</span>
                <span className="text-accent font-bold">{detail.registeredTeams}/{detail.maxTeams} Đội</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2.5 mb-2">
                <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="text-xs text-subtitle">Còn lại {detail.maxTeams - detail.registeredTeams} suất - Đóng cổng: {new Date(detail.timeLine.registrationEnd).toLocaleDateString('vi-VN')}</p>
           </div>
        </div>
      </div>
    </section>
  );
};
export default TournamentDetailHero;