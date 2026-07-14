import { Calendar, PlayCircle, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import type { ResultStat } from "@/types/orgResultMgmt";
import { Card } from "@/components/ui/card";

const iconMap = { total: Calendar, live: PlayCircle, completed: CheckCircle2, pending: Clock, synced: RefreshCw };

const ResultStats = ({ stats }: { stats: ResultStat[] }) => {
  return (
    <div className="flex gap-4 overflow-x-auto beautiful-scrollbar pb-2">
      {stats.map((stat) => {
        const Icon = iconMap[stat.iconType];
        return (
          <Card key={stat.id} className="p-4 flex flex-col justify-center items-center text-center min-w-[140px] flex-1 border-border shadow-sm">
            <div className={`w-8 h-8 rounded-md flex items-center justify-center mb-2 ${stat.color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <h3 className="text-2xl font-black text-foreground">{stat.value}</h3>
            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">{stat.label}</p>
          </Card>
        );
      })}
    </div>
  );
};
export default ResultStats;