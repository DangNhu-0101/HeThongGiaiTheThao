import type { Match } from "@/types/tournament";

const UpcomingMatches = ({ matches }: { matches: Match[] }) => {
  return (
    <section className="py-12 px-8 max-w-7xl mx-auto">
       <div className="flex justify-between items-end mb-8 border-b border-[var(--border)] pb-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--foreground)] uppercase">Trận đấu sắp diễn ra</h2>
          <p className="text-[var(--muted-foreground)] text-sm mt-1">Theo dõi lịch thi đấu mới nhất</p>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {matches.map((m) => (
          <div key={m._id} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 flex flex-col md:flex-row items-center justify-between hover:border-[var(--ring)] transition-colors">
            <div className="flex-1">
              <p className="text-xs font-semibold text-[var(--ring)] mb-1">{m.tournamentName} - {m.round}</p>
              <div className="flex items-center gap-6">
                <div className="flex-1 text-right font-bold text-[var(--card-foreground)]">{m.teamA.name}</div>
                <div className="bg-[var(--muted)] px-4 py-2 rounded-lg text-sm font-bold text-[var(--muted-foreground)]">
                  {m.status === 'live' ? <span className="text-[var(--primary)]">{m.teamA.score} - {m.teamB.score}</span> : 'VS'}
                </div>
                <div className="flex-1 font-bold text-[var(--card-foreground)]">{m.teamB.name}</div>
              </div>
            </div>
            <div className="mt-4 md:mt-0 md:ml-8 md:pl-8 md:border-l border-[var(--border)] text-center md:text-right min-w-[120px]">
              {m.status === 'live' ? (
                 <span className="inline-flex items-center gap-1 text-[var(--primary)] text-sm font-bold"><span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse"></span> Trực tiếp</span>
              ) : (
                <p className="text-sm font-semibold text-[var(--muted-foreground)]">{new Date(m.startTime).toLocaleDateString('vi-VN')} <br/> {new Date(m.startTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
export default UpcomingMatches;