import type { GroupStanding } from "@/types/standing";

const rowStylesForStatus = (status: string) => {
  if (status === "advance") return { rowStyle: "bg-green-50/40 hover:bg-green-50/80", borderStyle: "border-l-4 border-green-500" };
  if (status === "eliminated") return { rowStyle: "bg-red-50/30 hover:bg-red-50/60", borderStyle: "border-l-4 border-red-400" };
  if (status === "playoff") return { rowStyle: "bg-orange-50/40 hover:bg-orange-50/80", borderStyle: "border-l-4 border-orange-400" };
  return { rowStyle: "hover:bg-muted/30", borderStyle: "border-l-4 border-transparent" };
};

const GroupStandingsTable = ({ group }: { group: GroupStanding }) => {
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden mb-8">
      {/* Tiêu đề Bảng */}
      <div className="px-6 py-4 flex items-center gap-2 border-b border-border bg-muted/30">
        <div className="w-1 h-5 bg-accent rounded-full"></div>
        <h3 className="font-bold uppercase text-foreground">{group.groupName}</h3>
      </div>
      
      {/* Bảng Xếp Hạng */}
      <div className="overflow-x-auto beautiful-scrollbar">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase text-muted-foreground border-b border-border bg-muted/10">
            <tr>
              <th className="px-4 py-3 font-semibold w-10">#</th>
              <th className="px-4 py-3 font-semibold min-w-[200px]">Đội thi đấu</th>
              <th className="px-2 py-3 font-semibold text-center" title="Số trận đã đấu">Trận</th>
              <th className="px-2 py-3 font-semibold text-center" title="Thắng">T</th>
              <th className="px-2 py-3 font-semibold text-center" title="Hòa">H</th>
              <th className="px-2 py-3 font-semibold text-center" title="Thua">B</th>
              <th className="px-2 py-3 font-semibold text-center" title="Điểm ghi được">BT</th>
              <th className="px-2 py-3 font-semibold text-center" title="Điểm mất">BB</th>
              <th className="px-2 py-3 font-semibold text-center" title="Hiệu số">HS</th>
              <th className="px-4 py-3 font-bold text-center text-foreground" title="Điểm số">Điểm</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {group.teams.map((team) => {
              // Xử lý logic tô viền và màu nền dựa trên trạng thái
              const { rowStyle, borderStyle } = rowStylesForStatus(team.status);
              return (
                <tr key={team.id} className={`${rowStyle} transition-colors`}>
                  <td className={`px-4 py-3 font-medium text-muted-foreground ${borderStyle}`}>
                    {team.rank}
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-[10px]">
                      {team.logo}
                    </div>
                    {team.teamName}
                  </td>
                  <td className="px-2 py-3 text-center text-muted-foreground">{team.played}</td>
                  <td className="px-2 py-3 text-center text-muted-foreground">{team.won}</td>
                  <td className="px-2 py-3 text-center text-muted-foreground">{team.drawn}</td>
                  <td className="px-2 py-3 text-center text-muted-foreground">{team.lost}</td>
                  <td className="px-2 py-3 text-center text-muted-foreground">{team.goalsFor}</td>
                  <td className="px-2 py-3 text-center text-muted-foreground">{team.goalsAgainst}</td>
                  <td className="px-2 py-3 text-center font-medium">
                    {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-foreground">{team.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GroupStandingsTable;
