import { MapPin, Calendar, Trophy, Users, Activity } from "lucide-react";
import type { MatchInfo } from "@/types/matchDetail";

const MatchInfoCard = ({ info }: { info: MatchInfo }) => {
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
        <div className="w-1 h-5 bg-primary rounded-full"></div>
        <h3 className="font-bold uppercase text-foreground">Thông tin trận đấu</h3>
      </div>

      <ul className="space-y-5">
        <li className="flex gap-4 items-start">
          <MapPin className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-0.5">Địa điểm</p>
            <p className="text-sm font-bold text-foreground">{info.venue}</p>
          </div>
        </li>
        <li className="flex gap-4 items-start">
          <Calendar className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-0.5">Thời gian</p>
            <p className="text-sm font-bold text-foreground">{info.date}</p>
            <p className="text-xs text-muted-foreground">{info.time}</p>
          </div>
        </li>
        <li className="flex gap-4 items-start">
          <Trophy className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-0.5">Vòng đấu</p>
            <p className="text-sm font-bold text-foreground">{info.round}</p>
          </div>
        </li>
        <li className="flex gap-4 items-start">
          <Users className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-0.5">Trọng tài chính</p>
            <p className="text-sm font-bold text-foreground">Nguyễn Trọng Tài</p>
          </div>
        </li>
        <li className="flex gap-4 items-start">
          <Activity className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-0.5">Bộ môn</p>
            <p className="text-sm font-bold text-foreground">{info.sport}</p>
          </div>
        </li>
      </ul>
    </div>
  );
};
export default MatchInfoCard;