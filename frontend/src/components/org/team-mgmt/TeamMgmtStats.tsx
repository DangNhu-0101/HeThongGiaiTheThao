import { Shield, CheckCircle2, Clock, XCircle, Users, Activity, Gift } from "lucide-react";
import type { TeamMgmtStat } from "@/types/orgTeamMgmt";
import { Card } from "@/components/ui/card";

const iconMap = {
  total: Shield,
  approved: CheckCircle2,
  pending: Clock,
  rejected: XCircle,
  athletes: Users,
  sports: Activity,
  free: Gift // Icon cho Đội miễn phí
};

const TeamMgmtStats = ({ stats }: { stats: TeamMgmtStat[] }) => {
  return (
    <div className="flex gap-4 overflow-x-auto beautiful-scrollbar pb-4 mb-2">
      {stats.map((stat) => {
        const Icon = iconMap[stat.iconType];
        return (
          <Card key={stat.id} className="p-4 flex flex-col justify-center items-center text-center hover:shadow-md transition-shadow min-w-[120px] shrink-0 border-border">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${stat.color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <h3 className="text-xl font-black text-foreground leading-none mb-1">{stat.value}</h3>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">{stat.label}</p>
          </Card>
        );
      })}
    </div>
  );
};
export default TeamMgmtStats;