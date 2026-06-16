import { PlayCircle, Bell, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MatchDetailData } from "@/types/matchDetail";

const MatchHero = ({ match }: { match: MatchDetailData }) => {
  return (
    <section className="bg-header text-white pb-0 pt-6">
      <div className="max-w-7xl mx-auto px-8">
        
        {/* Breadcrumb & Status */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold mb-8">
          <span className="bg-red-500 text-white px-2 py-0.5 rounded flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> LIVE
          </span>
          <span className="bg-white/10 px-2 py-0.5 rounded">{match.info.round}</span>
          <span className="text-muted-foreground">{match.tournamentName}</span>
          <span className="text-muted-foreground hidden sm:inline">•</span>
          <span className="text-muted-foreground hidden sm:inline">{match.info.venue}</span>
        </div>

        {/* Score Board */}
        <div className="flex flex-col md:flex-row justify-between items-center pb-12 gap-8">
          
          {/* Team A */}
          <div className="flex items-center gap-4 flex-1 justify-end md:justify-start w-full md:w-auto">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-xl font-black shadow-inner border border-white/20">
              {match.teamA.logo}
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase">{match.teamA.name}</h2>
              <p className="text-xs text-muted-foreground mb-1">{match.teamA.country} - {match.teamA.group}</p>
              <div className="flex gap-1">
                {match.teamA.form.map((f, i) => (
                  <span key={i} className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${f.color}`}>
                    {f.result}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Center Score */}
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="flex items-center justify-center gap-4 text-5xl md:text-7xl font-black">
              <span>{match.teamA.score}</span>
              <div className="flex flex-col items-center justify-center">
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full mb-2">
                  {match.liveMinute}
                </span>
                <span className="text-3xl text-muted-foreground">-</span>
              </div>
              <span>{match.teamB.score}</span>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button className="bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 gap-2 h-9">
                <PlayCircle className="w-4 h-4" /> Xem trực tiếp
              </Button>
              <Button variant="outline" className="border-white/20 bg-white/5 hover:bg-white/10 text-white gap-2 h-9">
                <Bell className="w-4 h-4" /> Nhận thông báo
              </Button>
              <Button variant="outline" className="border-white/20 bg-white/5 hover:bg-white/10 text-white h-9 px-3">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Team B */}
          <div className="flex items-center gap-4 flex-1 justify-start md:justify-end w-full md:w-auto text-left md:text-right flex-row-reverse md:flex-row">
            <div>
              <h2 className="text-2xl font-black uppercase">{match.teamB.name}</h2>
              <p className="text-xs text-muted-foreground mb-1">{match.teamB.country} - {match.teamB.group}</p>
              <div className="flex gap-1 justify-start md:justify-end">
                {match.teamB.form.map((f, i) => (
                  <span key={i} className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${f.color}`}>
                    {f.result}
                  </span>
                ))}
              </div>
            </div>
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-xl font-black shadow-inner border border-white/20">
              {match.teamB.logo}
            </div>
          </div>

        </div>

      </div>
      
      {/* Decorative Bottom Curve/Border */}
      <div className="w-full h-2 bg-gradient-to-r from-primary via-accent to-primary"></div>
    </section>
  );
};
export default MatchHero;