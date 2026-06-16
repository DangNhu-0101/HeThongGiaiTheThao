import type { TeamMember } from "@/types/Team";

const MemberCard = ({ member }: { member: TeamMember }) => {
  const isCaptain = member.role === 'Đội trưởng';

  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:shadow-lg hover:border-primary/30 transition-all group flex flex-col">
      <div className="flex items-start gap-4 mb-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-xl bg-secondary flex flex-shrink-0 items-center justify-center text-secondary-foreground font-black text-xl shadow-inner group-hover:scale-105 transition-transform">
          {member.avatar}
        </div>
        
        {/* Info */}
        <div className="flex-1">
          <h4 className="font-bold text-foreground text-lg leading-tight">{member.name}</h4>
          <p className="text-xs text-muted-foreground mt-1 mb-2">{member.country}</p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
            isCaptain ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-muted text-muted-foreground'
          }`}>
            {member.role}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 py-3 border-t border-border mt-auto">
        <div className="text-center bg-muted/30 rounded-lg py-2">
          <div className="text-lg font-bold text-foreground">{member.stats.matches}</div>
          <div className="text-[10px] text-muted-foreground font-semibold uppercase">Trận</div>
        </div>
        <div className="text-center bg-muted/30 rounded-lg py-2">
          <div className="text-lg font-bold text-foreground">{member.stats.wins}</div>
          <div className="text-[10px] text-muted-foreground font-semibold uppercase">Thắng</div>
        </div>
        <div className="text-center bg-accent/10 rounded-lg py-2 border border-accent/20">
          <div className="text-lg font-bold text-accent-foreground">{member.stats.rating}</div>
          <div className="text-[10px] text-accent-foreground font-semibold uppercase">Hạng</div>
        </div>
      </div>
    </div>
  );
};

export default MemberCard;