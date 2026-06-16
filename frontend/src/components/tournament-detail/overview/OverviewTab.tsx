import SportsCarousel from "@/components/home/SportsCarousel";
import UpcomingMatches from "@/components/home/UpcomingMatches";
import { Button } from "@/components/ui/button";
import type { TournamentDetail, Sport, Match, MatchResult } from "@/types/tournament";

interface OverviewTabProps {
  detail: TournamentDetail;
  sports: Sport[];
  upcomingMatches: Match[];
  recentResults: MatchResult[];
}

const OverviewTab = ({ detail, sports, upcomingMatches, recentResults }: OverviewTabProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8">
      {/* Cột trái */}
      <div className="md:col-span-2 space-y-8">
        <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold uppercase mb-4 border-l-4 border-primary pl-2">Về giải đấu này</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{detail.about}</p>
        </section>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
           <SportsCarousel sports={sports} />
        </div>

        <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold uppercase mb-4 border-l-4 border-primary pl-2">Thể thức thi đấu</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Đã xóa :any ở biến f */}
            {detail.format.map((f, idx) => (
              <div key={idx} className="bg-muted rounded-lg p-4">
                <h4 className="font-bold text-foreground mb-1">{f.name}</h4>
                <p className="text-xs text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold uppercase border-l-4 border-primary pl-2">Kết quả gần đây</h3>
            <span className="text-xs text-primary font-bold cursor-pointer hover:underline">Xem tất cả &rarr;</span>
          </div>
          <div className="space-y-3">
            {/* Đã xóa :any ở biến r */}
            {recentResults.map((r) => (
              <div key={r._id} className="flex items-center justify-between bg-muted/50 p-3 rounded-lg text-sm border border-border/50">
                <div className="w-16 text-xs text-muted-foreground">{r.date}</div>
                <div className="flex-1 text-right font-bold">{r.teamA.name}</div>
                <div className="px-4 py-1 mx-4 bg-header text-white font-bold rounded">{r.teamA.score} - {r.teamB.score}</div>
                <div className="flex-1 font-bold">{r.teamB.name}</div>
                <div className="w-24 text-right text-xs text-muted-foreground hidden sm:block">{r.stadium}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Cột phải */}
      <div className="space-y-6">
        <div className="bg-primary text-white rounded-xl p-6 shadow-lg">
          <h3 className="font-bold uppercase mb-2">Đang mở đăng ký</h3>
          <p className="text-xs mb-4 text-white/80">Chỉ còn {detail.maxTeams - detail.registeredTeams} suất. Đăng ký trước {new Date(detail.timeLine.registrationEnd).toLocaleDateString('vi-VN')}.</p>
          <div className="w-full bg-black/20 rounded-full h-2 mb-4">
            <div className="bg-accent h-2 rounded-full" style={{ width: `${(detail.registeredTeams / detail.maxTeams) * 100}%` }}></div>
          </div>
          <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 mb-2 font-bold">Đăng ký ngay</Button>
          <Button variant="outline" className="w-full border-white/30 text-white hover:bg-white/10">Liên hệ Ban tổ chức</Button>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="font-bold uppercase mb-4 text-sm text-muted-foreground">Thông tin giải</h3>
          <ul className="space-y-4 text-sm">
            <li className="flex flex-col"><span className="text-xs text-muted-foreground">Môn thi đấu</span><span className="font-semibold">{detail.sportType[0]}</span></li>
            <li className="flex flex-col"><span className="text-xs text-muted-foreground">Giải thưởng</span><span className="font-semibold text-accent-foreground">{detail.prizes[0].amount}</span></li>
            <li className="flex flex-col"><span className="text-xs text-muted-foreground">Ban tổ chức</span><span className="font-semibold">{detail.organizer}</span></li>
          </ul>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
           <h3 className="font-bold uppercase mb-4 text-sm text-muted-foreground">Cơ cấu giải thưởng</h3>
           <div className="space-y-2">
             {/* Đã xóa :any ở biến p */}
             {detail.prizes.map((p, idx) => (
               <div key={idx} className={`flex justify-between items-center p-3 rounded-lg border ${p.color}`}>
                 <span className="font-bold text-sm">{p.rank}</span>
                 <span className="font-bold">{p.amount}</span>
               </div>
             ))}
           </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <UpcomingMatches matches={upcomingMatches.slice(0,2)} />
        </div>
      </div>
    </div>
  );
};
export default OverviewTab;