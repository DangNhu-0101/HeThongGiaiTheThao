import { Trophy, PlayCircle, UserPlus, FileEdit, CheckCircle2 } from "lucide-react";
import type { TournamentMgmtStat } from "@/types/orgTournamentMgmt";
import { Card } from "@/components/ui/card";

const iconMap = {
  total: Trophy,
  live: PlayCircle,
  open: UserPlus,
  draft: FileEdit,
  completed: CheckCircle2
};

const MgmtStats = ({ stats }: { stats: TournamentMgmtStat[] }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      {stats.map((stat) => {
        const Icon = iconMap[stat.iconType];
        return (
          <Card key={stat.id} className="p-4 flex flex-col justify-center items-center text-center hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${stat.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-black text-foreground leading-none mb-1">{stat.value}</h3>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">{stat.label}</p>
          </Card>
        );
      })}
    </div>
  );
};
export default MgmtStats;