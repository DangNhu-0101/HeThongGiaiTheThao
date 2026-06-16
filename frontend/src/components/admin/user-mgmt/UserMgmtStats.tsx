import { Users, Building2, Award, UserCheck } from "lucide-react";
import type { UserStatItem } from "@/types/adminUserMgmt";

const iconMap = { total: Users, organization: Building2, referee: Award, athlete: UserCheck };

const UserMgmtStats = ({ stats }: { stats: UserStatItem[] }) => {
  return (
    <div className="flex gap-4 overflow-x-auto beautiful-scrollbar pb-2">
      {stats.map((stat) => {
        const Icon = iconMap[stat.iconType];
        return (
          <div key={stat.id} className="bg-card p-4 rounded-xl border border-border flex items-center gap-4 flex-1 min-w-[220px] shadow-sm">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-foreground leading-none">{stat.value.toLocaleString('vi-VN')}</h3>
              <p className="text-xs font-bold text-muted-foreground mt-1 uppercase">{stat.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
export default UserMgmtStats;