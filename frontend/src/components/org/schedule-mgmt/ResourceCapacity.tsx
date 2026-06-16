import { Info, ExternalLink } from "lucide-react";
import type { CapacityData } from "@/types/orgScheduleMgmt";

const ResourceCapacity = ({ data }: { data: CapacityData }) => {
  if (!data) return null;
  const percent = (used: number, total: number) => `${Math.min(100, (used / total) * 100)}%`;

  return (
    <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-4 shadow-sm shrink-0">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-sm text-purple-900 flex items-center gap-2"><Info className="w-4 h-4 text-purple-500" /> Năng lực tài nguyên</h3>
        <ExternalLink className="w-4 h-4 text-purple-400 cursor-pointer hover:text-purple-700" />
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-xs font-semibold mb-1 text-muted-foreground"><span>Trọng tài</span><span className="text-foreground">{data.referees.used}/{data.referees.total} phân công</span></div>
          <div className="w-full bg-muted rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: percent(data.referees.used, data.referees.total) }}></div></div>
        </div>
        <div>
          <div className="flex justify-between text-xs font-semibold mb-1 text-muted-foreground"><span>Sân thi đấu</span><span className="text-foreground">{data.venues.used}/{data.venues.total} đang dùng</span></div>
          <div className="w-full bg-muted rounded-full h-1.5"><div className="bg-orange-500 h-1.5 rounded-full" style={{ width: percent(data.venues.used, data.venues.total) }}></div></div>
        </div>
        <div>
          <div className="flex justify-between text-xs font-semibold mb-1 text-muted-foreground"><span>Lịch thi đấu</span><span className="text-foreground">{data.schedule.scheduled}/{data.schedule.total} xếp lịch</span></div>
          <div className="w-full bg-muted rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: percent(data.schedule.scheduled, data.schedule.total) }}></div></div>
        </div>
      </div>
    </div>
  );
};
export default ResourceCapacity;