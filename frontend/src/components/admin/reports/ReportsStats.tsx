import { Users, Shield, DollarSign } from "lucide-react";
import type { ReportStatItem } from "@/types/adminReports";

const iconMap = { athletes: Users, teams: Shield, revenue: DollarSign };

const ReportsStats = ({ stats }: { stats: ReportStatItem[] }) => {
  return (
    <div className="flex gap-4 overflow-x-auto beautiful-scrollbar pb-2">
      {stats.map((stat) => {
        const Icon = iconMap[stat.iconType];
        return (
          <div key={stat.id} className="bg-card p-5 rounded-xl border border-border shadow-sm flex-1 min-w-[240px]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase">{stat.label}</h3>
                <p className="text-2xl font-black text-foreground mt-1">{stat.value}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center text-foreground border border-border">
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <p className={`text-[10px] font-bold ${stat.isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {stat.trend}
            </p>
          </div>
        );
      })}
    </div>
  );
};
export default ReportsStats;