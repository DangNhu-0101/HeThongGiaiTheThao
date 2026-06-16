import type { OrgTournament } from "@/types/orgDashboard";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

const OrgTournaments = ({ tournaments }: { tournaments: OrgTournament[] }) => {
  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6 border-l-4 border-primary pl-3">
        <h3 className="font-bold uppercase text-foreground">Trạng thái Giải đấu</h3>
        <Button variant="outline" size="sm" className="text-xs font-bold text-primary border-primary hover:bg-primary/10">Quản lý tất cả</Button>
      </div>

      <div className="space-y-6">
        {tournaments.map((t) => (
          <div key={t.id} className="border-b border-border/50 pb-6 last:border-0 last:pb-0">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-xs shrink-0 text-muted-foreground">
                  {t.sport.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-foreground">{t.name}</h4>
                  <p className="text-[10px] text-muted-foreground uppercase">{t.sport} • {t.teamsCount} Đội • {t.season}</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-md border flex items-center gap-1 ${
                t.status === 'Live' ? 'bg-red-50 text-red-600 border-red-200' : 
                t.status === 'Reg. Open' ? 'bg-blue-50 text-blue-600 border-blue-200' : 
                'bg-gray-50 text-gray-600 border-gray-200'
              }`}>
                {t.status === 'Live' && <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>}
                {t.status}
              </span>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Tiến độ</span>
                <span className="text-primary">{t.progress}%</span>
              </div>
              <Progress value={t.progress} className={`h-2 ${t.status === 'Live' ? '[&>div]:bg-primary' : t.status === 'Reg. Open' ? '[&>div]:bg-accent' : '[&>div]:bg-muted-foreground'}`} />
            </div>

            <div className="flex gap-4 mt-3 text-[10px] text-muted-foreground font-medium">
              <span className="flex items-center gap-1">⏱ {t.detail1}</span>
              <span className="flex items-center gap-1">📅 {t.detail2}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
export default OrgTournaments;