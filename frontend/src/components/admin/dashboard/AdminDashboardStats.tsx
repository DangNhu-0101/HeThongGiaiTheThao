import { Building2, Trophy, Users, Activity, Clock } from "lucide-react";
import type { AdminStat } from "@/types/adminDashboard";

const statIcons = { orgs: Building2, tournaments: Trophy, users: Users, sports: Activity, pending: Clock };

const AdminDashboardStats = ({ stats }: { stats: AdminStat[] }) => {
  return (
    <div className="flex gap-4 overflow-x-auto beautiful-scrollbar pb-2">
      {stats.map((stat) => {
        const Icon = statIcons[stat.type];
        return (
          <div key={stat.id} className={`bg-card p-5 rounded-xl border flex-1 min-w-[200px] shadow-sm ${stat.type === 'pending' ? 'border-amber-200' : 'border-border'}`}>
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg ${stat.type === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-xs font-bold ${stat.isPositive ? 'text-green-500' : stat.type === 'pending' ? 'text-amber-500' : 'text-muted-foreground'}`}>
                {stat.trend}
              </span>
            </div>
            <h3 className="text-2xl font-black text-foreground">{stat.value}</h3>
            <p className="text-xs font-bold text-muted-foreground mt-1">{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
};
export default AdminDashboardStats;