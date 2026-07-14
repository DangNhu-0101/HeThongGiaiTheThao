import type { BracketTreeNode } from "@/types/bracketTree";

const BracketNodeCard = ({ match }: { match: BracketTreeNode }) => {
  const isLive = match.status === 'live';

  return (
    <div className={`w-full h-full bg-card border rounded-lg shadow-sm flex flex-col text-sm overflow-hidden ${isLive ? 'border-primary' : 'border-border'}`}>
      {/* Team A */}
      <div className={`flex items-center justify-between p-2 h-9 border-b border-border ${match.teamA?.isWinner ? 'bg-green-50/50' : ''}`}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground">
            {match.teamA?.logo || '-'}
          </div>
          <span className={`font-semibold text-xs truncate w-32 ${!match.teamA ? 'text-muted-foreground italic' : 'text-foreground'}`}>
            {match.teamA?.name || 'TBD'}
          </span>
        </div>
        <span className={`font-bold text-xs ${match.teamA?.isWinner ? 'text-green-600' : 'text-muted-foreground'}`}>
          {match.teamA?.score ?? '-'}
        </span>
      </div>

      {/* Team B */}
      <div className={`flex items-center justify-between p-2 h-9 ${match.teamB?.isWinner ? 'bg-green-50/50' : ''}`}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground">
            {match.teamB?.logo || '-'}
          </div>
          <span className={`font-semibold text-xs truncate w-32 ${!match.teamB ? 'text-muted-foreground italic' : 'text-foreground'}`}>
            {match.teamB?.name || 'TBD'}
          </span>
        </div>
        <span className={`font-bold text-xs ${match.teamB?.isWinner ? 'text-green-600' : 'text-muted-foreground'}`}>
          {match.teamB?.score ?? '-'}
        </span>
      </div>

      {/* Footer */}
      <div className="bg-muted/50 px-2 flex-1 flex justify-between items-center text-[10px] border-t border-border">
        <span className="text-muted-foreground truncate w-3/4">{match.round} • {match.info}</span>
        {isLive && <span className="text-primary font-bold flex items-center gap-1 shrink-0"><span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span> LIVE</span>}
      </div>
    </div>
  );
};
export default BracketNodeCard;