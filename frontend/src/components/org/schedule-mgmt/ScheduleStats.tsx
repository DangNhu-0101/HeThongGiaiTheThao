import { CalendarDays, CheckCircle2, Clock, AlertTriangle, UserCheck } from "lucide-react";
import type { ScheduleStat } from "@/types/orgScheduleMgmt";
import { Card } from "@/components/ui/card";

const iconMap = { total: CalendarDays, scheduled: CheckCircle2, unscheduled: Clock, conflict: AlertTriangle, referee: UserCheck };

const ScheduleStats = ({ stats }: { stats: ScheduleStat[] }) => {
  return (
    <div className="flex gap-3 overflow-x-auto beautiful-scrollbar pb-2">
      {stats.map((stat) => {
        const Icon = iconMap[stat.iconType];
        return (
          <Card key={stat.id} className="p-4 flex flex-col justify-center items-center text-center min-w-[130px] flex-1 border-border shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${stat.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-black text-foreground leading-none">{stat.value}</h3>
            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1.5">{stat.label}</p>
          </Card>
        );
      })}
    </div>
  );
};
export default ScheduleStats;