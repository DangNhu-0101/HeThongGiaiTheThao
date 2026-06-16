import { MapPin, Calendar, UserCheck } from "lucide-react";
import  type { TeamDetailInfo } from "@/types/Team";

const TeamHero = ({ info }: { info: TeamDetailInfo }) => {
  return (
    <section className="bg-header text-header-foreground py-12 px-8 border-b-4 border-primary">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-8">
        
        {/* Phần Logo và Tên */}
        <div className="flex items-center gap-6 flex-1">
          <div className="w-32 h-32 bg-white rounded-2xl shadow-xl flex items-center justify-center text-4xl font-black text-primary border-4 border-white/20">
            {info.logo}
          </div>
          <div className="space-y-3">
            <div className="flex gap-2 items-center text-xs font-bold">
              <span className="bg-blue-500/20 text-blue-200 px-2 py-1 rounded-md uppercase border border-blue-400/30">{info.sport}</span>
              <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-md flex items-center gap-1 border border-green-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> {info.status}
              </span>
              <span className="bg-white/10 text-white/80 px-2 py-1 rounded-md">{info.division}</span>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-wide">{info.name}</h1>
            <div className="flex gap-4 text-sm text-white/70 font-medium">
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-accent" /> {info.location}</span>
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4 text-accent" /> Thành lập {info.founded}</span>
              <span className="flex items-center gap-1"><UserCheck className="w-4 h-4 text-accent" /> HLV: {info.coach}</span>
            </div>
          </div>
        </div>

        {/* Phần Thống kê (Stats) */}
        <div className="flex gap-4 w-full md:w-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 min-w-[100px] text-center border border-white/10">
            <div className="text-3xl font-black text-accent">{info.overallStats.players}</div>
            <div className="text-xs text-white/70 font-semibold uppercase mt-1">Thành viên</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 min-w-[100px] text-center border border-white/10">
            <div className="text-3xl font-black text-white">{info.overallStats.wins}</div>
            <div className="text-xs text-white/70 font-semibold uppercase mt-1">Trận thắng</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 min-w-[100px] text-center border border-white/10">
            <div className="text-3xl font-black text-white">{info.overallStats.titles}</div>
            <div className="text-xs text-white/70 font-semibold uppercase mt-1">Danh hiệu</div>
          </div>
          <div className="bg-primary/80 backdrop-blur-md rounded-xl p-4 min-w-[100px] text-center border border-primary-hover shadow-lg">
            <div className="text-3xl font-black text-white">#{info.overallStats.ranking}</div>
            <div className="text-xs text-white/90 font-semibold uppercase mt-1">Xếp hạng</div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default TeamHero;