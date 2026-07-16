import type { Team } from "@/types/tournament";

const TeamCard = ({ team }: { team: Team }) => {
  const athleteCount = Number(team.stats.athletes || 0);

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-5 transition-all hover:border-ring hover:shadow-md">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary text-xl font-bold text-secondary-foreground">
            {team.logo}
          </div>
          <div className="min-w-0">
            <h4 className="truncate font-bold text-foreground">{team.name}</h4>
            <p className="truncate text-xs text-muted-foreground">{team.sport} • {team.location}</p>
          </div>
        </div>
        <span className={`shrink-0 rounded px-2 py-1 text-[10px] font-bold uppercase ${
          team.status === "active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
        }`}>
          {team.status === "active" ? "Đã duyệt" : "Chờ duyệt"}
        </span>
      </div>

      <div className="my-auto grid grid-cols-3 gap-2 border-y border-border/50 py-4 text-center">
        <div>
          <p className="text-xs text-muted-foreground">VĐV</p>
          <p className="font-bold">{athleteCount}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Thắng</p>
          <p className="font-bold">{team.stats.wins}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Tỉ lệ</p>
          <p className="font-bold text-primary">{team.stats.winRate}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between pt-2">
        <div className="flex -space-x-2">
          <div className="h-6 w-6 rounded-full border border-white bg-gray-300" />
          <div className="h-6 w-6 rounded-full border border-white bg-gray-400" />
          {athleteCount > 2 && (
            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white bg-gray-500 text-[8px] text-white">
              +{athleteCount - 2}
            </div>
          )}
        </div>
        <button className="text-xs font-bold text-ring hover:underline">Xem đội &rarr;</button>
      </div>
    </div>
  );
};

export default TeamCard;
