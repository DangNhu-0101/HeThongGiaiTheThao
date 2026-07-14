import type { Team } from "@/types/tournament";

const TeamCard = ({ team }: { team: Team }) => {
  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-ring transition-all flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center font-bold text-secondary-foreground text-xl">
            {team.logo}
          </div>
          <div>
            <h4 className="font-bold text-foreground">{team.name}</h4>
            <p className="text-xs text-muted-foreground">{team.sport} • {team.location}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
          team.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {team.status === 'active' ? 'Đã duyệt' : 'Chờ duyệt'}
        </span>
      </div>
      
      <div className="grid grid-cols-3 gap-2 py-4 border-y border-border/50 my-auto text-center">
        <div>
          <p className="text-xs text-muted-foreground">V?V</p>
          <p className="font-bold">{team.stats.athletes}</p>
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

      <div className="mt-4 pt-2 flex justify-between items-center">
        <div className="flex -space-x-2">
           <div className="w-6 h-6 rounded-full bg-gray-300 border border-white"></div>
           <div className="w-6 h-6 rounded-full bg-gray-400 border border-white"></div>
           <div className="w-6 h-6 rounded-full bg-gray-500 border border-white flex items-center justify-center text-[8px] text-white">+{team.stats.athletes - 2}</div>
        </div>
        <button className="text-xs font-bold text-ring hover:underline">Xem đội &rarr;</button>
      </div>
    </div>
  );
};
export default TeamCard;