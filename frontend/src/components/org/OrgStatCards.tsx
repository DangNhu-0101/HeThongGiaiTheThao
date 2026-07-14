import { Trophy, Shield, Users, Activity, DollarSign, MapPin } from "lucide-react";
import type { OrgStat } from "@/types/orgDashboard";
import { Card } from "@/components/ui/card";

const iconMap = {
  trophy: <Trophy className="w-5 h-5 text-blue-500" />,
  shield: <Shield className="w-5 h-5 text-indigo-500" />,
  users: <Users className="w-5 h-5 text-green-500" />,
  activity: <Activity className="w-5 h-5 text-orange-500" />,
  dollar: <DollarSign className="w-5 h-5 text-purple-500" />,
  map: <MapPin className="w-5 h-5 text-red-500" />
};

const OrgStatCards = ({ stats }: { stats: OrgStat[] }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      {stats.map((stat) => (
        <Card key={stat.id} className="p-4 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
              {iconMap[stat.iconType]}
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${stat.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {stat.trend}
            </span>
          </div>
          <h3 className="text-3xl font-black text-foreground">{stat.value}</h3>
          <p className="text-xs font-bold text-muted-foreground uppercase mt-1 truncate">{stat.title}</p>
          <div className="flex items-center gap-1 mt-auto pt-4 text-[10px] text-muted-foreground">
            <span className={`w-1.5 h-1.5 rounded-full ${stat.isPositive ? 'bg-green-500' : 'bg-red-500'}`}></span>
            {stat.subtext}
          </div>
        </Card>
      ))}
    </div>
  );
};
export default OrgStatCards;