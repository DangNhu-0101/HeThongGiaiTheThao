import { useEffect, useState } from "react";
import { financeService } from "@/services/financeService";
import type { Sponsor } from "@/types/sponsor";
import { useTournamentStore } from "@/stores/useTournamentStore";


export function SponsorLogo() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const { tournamentList } = useTournamentStore();

  useEffect(() => {
    async function fetchSponsors() {
      if (tournamentList && tournamentList.length > 0) {
        // Lấy ID của giải đấu đầu tiên hoặc giải đấu đang active
        const activeTourId = tournamentList[0]._id;
        if (activeTourId) {
          try {
            const data = await financeService.getSponsors(activeTourId);
            setSponsors(data.filter((s: Sponsor) => s.logo));
          } catch (error) {
            console.error("Failed to fetch sponsors for home page", error);
          }
        }
      }
    }
    fetchSponsors();
  }, [tournamentList]);

  if (sponsors.length === 0) return null;

  return (
    <div className=" p-y-6  border-slate-100 shadow-sm text-center">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Được tài trợ bởi</h3>
      <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
        {sponsors.map(sponsor => (
          <div key={sponsor._id } className="group relative">
            <img 
              src={`http://localhost:5001/${sponsor.logo.replace(/\\/g, '/')}`} 
              alt={sponsor.name} 
              className="h-16 md:h-20 max-w-[150px] object-contain  group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-300"
            />
            {sponsor.sponsorType && (
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                {sponsor.sponsorType}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
