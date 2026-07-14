import { Target, Square, RefreshCw, AlertCircle } from "lucide-react";
import type { MatchEvent } from "@/types/matchDetail";

const getEventIcon = (type: string) => {
  switch (type) {
    case 'goal': return <Target className="w-4 h-4 text-green-500" />;
    case 'card-yellow': return <Square className="w-4 h-4 text-yellow-500 fill-yellow-500" />;
    case 'substitution': return <RefreshCw className="w-4 h-4 text-blue-500" />;
    default: return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
  }
};

const getEventColor = (type: string) => {
  switch (type) {
    case 'goal': return 'border-green-500/30 bg-green-50/50';
    case 'card-yellow': return 'border-yellow-500/30 bg-yellow-50/50';
    case 'substitution': return 'border-blue-500/30 bg-blue-50/50';
    default: return 'border-border bg-card';
  }
};

const MatchTimeline = ({ events, teamAId }: { events: MatchEvent[], teamAId: string }) => {
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-red-500 rounded-full"></div>
          <h3 className="font-bold uppercase text-foreground">Sự kiện trận đấu</h3>
        </div>
        <button className="text-xs text-primary font-semibold hover:underline">Xem toàn bộ timeline &rarr;</button>
      </div>

      <div className="relative before:absolute before:inset-0 before:ml-5 md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-border before:via-border before:to-transparent">
        {events.map((ev) => {
          const isTeamA = ev.teamId === teamAId;
          
          return (
            <div key={ev.id} className={`relative flex items-center justify-between md:justify-normal w-full mb-8 ${isTeamA ? 'md:flex-row-reverse' : ''}`}>
              
              {/* Timeline Dot (Trung tâm) */}
              <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-muted text-xs font-bold text-muted-foreground z-10">
                {ev.minute}'
              </div>

              {/* Nội dung sự kiện */}
              <div className={`w-full pl-14 md:pl-0 md:w-5/12 ${isTeamA ? 'md:text-right md:pr-12' : 'md:text-left md:pl-12'}`}>
                <div className={`p-4 rounded-xl border shadow-sm ${getEventColor(ev.type)} relative`}>
                  {ev.isLive && (
                    <span className="absolute -top-2.5 right-4 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                      MỚI
                    </span>
                  )}
                  <div className={`flex items-center gap-2 mb-1 ${isTeamA ? 'md:flex-row-reverse' : ''}`}>
                    <div className="bg-background rounded-full p-1 shadow-sm shrink-0">
                      {getEventIcon(ev.type)}
                    </div>
                    <h4 className="font-bold text-sm text-foreground">{ev.title}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">{ev.description}</p>
                </div>
              </div>

            </div>
          );
        })}

        {/* Kick Off Marker */}
        <div className="relative flex items-center justify-center w-full mt-12 mb-4">
          <div className="bg-muted border border-border text-muted-foreground text-xs font-bold px-4 py-1.5 rounded-full z-10">
            KICK OFF - 0'
          </div>
        </div>
      </div>
    </div>
  );
};
export default MatchTimeline;
