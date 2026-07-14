import { Building2, CheckCircle2, Wrench, AlertTriangle, Users, Activity } from "lucide-react";
import type { ResourceStat } from "@/types/orgResourceMgmt";
import { Card } from "@/components/ui/card";

const iconMap = {
  total: Building2,
  available: CheckCircle2,
  maintenance: Wrench,
  warning: AlertTriangle,
  activity: Activity
};

const ResourceStats = ({ stats }: { stats: ResourceStat[] }) => {
  return (
    <div className="flex gap-4 overflow-x-auto beautiful-scrollbar pb-4 mb-2">
      {stats.map((stat) => {
        const Icon = stat.iconType === 'total' && stat.id.startsWith('r') ? Users : iconMap[stat.iconType];
        return (
          <Card key={stat.id} className="p-4 flex flex-col justify-center items-start hover:shadow-md transition-shadow min-w-[200px] flex-1 border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-foreground leading-none">{stat.value}</h3>
              </div>
            </div>
            <p className="text-xs font-bold text-foreground uppercase">{stat.label}</p>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">{stat.subtext}</p>
          </Card>
        );
      })}
    </div>
  );
};
export default ResourceStats;