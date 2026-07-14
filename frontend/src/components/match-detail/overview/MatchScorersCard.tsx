import type { KeyPlayer, MatchTeam } from "@/types/matchDetail";

const MatchScorersCard = ({ players, teamA, teamB }: { players: KeyPlayer[], teamA: MatchTeam, teamB: MatchTeam }) => {
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm mt-6">
      <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
        <div className="w-1 h-5 bg-green-500 rounded-full"></div>
        <h3 className="font-bold uppercase text-foreground">VĐV ghi điểm</h3>
      </div>

      <div className="space-y-3">
        {players.map(player => {
          const team = player.teamId === teamA.id ? teamA : teamB;
          return (
            <div key={player.id} className="flex justify-between items-center bg-muted/30 p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                  {player.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{player.name}</p>
                  <p className="text-[10px] text-muted-foreground">{team.name}</p>
                </div>
              </div>
              <div className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                {player.minute}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default MatchScorersCard;