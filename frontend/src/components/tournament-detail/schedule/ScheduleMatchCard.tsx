import { AlertTriangle } from "lucide-react";
import type { ScheduleMatch } from "@/types/schedule";

const ScheduleMatchCard = ({ match }: { match: ScheduleMatch }) => {
  // Cấu hình style dựa theo trạng thái trận đấu
  let cardStyle = "";
  let statusText = "";

  switch (match.status) {
    case 'scheduled':
      cardStyle = "bg-blue-50/50 border-l-4 border-blue-400";
      statusText = "text-blue-600";
      break;
    case 'completed':
      cardStyle = "bg-green-50/50 border-l-4 border-green-500 opacity-70";
      statusText = "text-green-600 font-bold";
      break;
    case 'live':
      cardStyle = "bg-red-50 border-l-4 border-red-500 shadow-sm";
      statusText = "text-red-600 font-bold animate-pulse";
      break;
    case 'conflict':
      cardStyle = "bg-yellow-50/80 border-l-4 border-yellow-500";
      statusText = "text-red-600 font-semibold";
      break;
    case 'final':
      cardStyle = "bg-gradient-to-r from-orange-400 to-orange-500 border-none text-white shadow-md";
      break;
    default:
      cardStyle = "bg-card border border-border";
  }

  const isFinal = match.status === 'final';

  return (
    <div className={`rounded-md p-3 text-xs mb-3 flex flex-col gap-2 transition-all hover:shadow-md ${cardStyle}`}>
      
      {/* Header Card: Thời gian & Sân */}
      <div className={`flex justify-between items-start ${isFinal ? 'text-white' : 'text-muted-foreground'}`}>
        <span className={`font-semibold ${isFinal ? 'text-white' : 'text-primary'}`}>
          {match.time} - {match.venue}
        </span>
      </div>

      {/* Đội thi đấu */}
      <div className={`font-bold ${isFinal ? 'text-white' : 'text-foreground'}`}>
        <p>{match.teamA.name} <span className="font-normal text-[10px] mx-1">vs</span> {match.teamB.name}</p>
      </div>

      {/* Footer Card: Trạng thái & Vòng đấu */}
      <div className={`flex justify-between items-center mt-1 ${isFinal ? 'text-white/90' : 'text-muted-foreground'}`}>
        
        {/* Tỉ số hoặc Round Info */}
        <div className="flex items-center gap-2">
          {match.score && <span className={statusText}>{match.score}</span>}
          <span>{match.roundInfo}</span>
        </div>

        {/* Indicator đặc biệt */}
        {match.status === 'live' && (
          <div className="flex items-center gap-1 text-red-600 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span> LIVE
          </div>
        )}
        
        {match.status === 'conflict' && (
          <div className="flex items-center gap-1 text-red-600" title={match.conflictReason}>
            <AlertTriangle className="w-3 h-3" />
            <span className="text-[10px]">Trùng lịch</span>
          </div>
        )}
        
      </div>
    </div>
  );
};

export default ScheduleMatchCard;