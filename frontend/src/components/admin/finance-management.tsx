import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet } from "lucide-react";
import { tournamentService } from "@/services/tournamentService";
import { financeService } from "@/services/financeService";
import { teamService } from "@/services/teamService";
import { FinanceOverview } from "@/components/finance/FinanceOverview";
import { FinanceSponsors } from "@/components/finance/FinanceSponsors";
import type { Tournament } from "@/types/tournament";
import type { Sponsor } from "@/types/sponsor";
import type { Team } from "@/types/Team";

export default function FinanceDashboard() {
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!id) return;
    await Promise.resolve();
    setIsLoading(true);
    try {
      const [tourData, sponsorData, teamData] = await Promise.all([
        tournamentService.getById(id),
        financeService.getSponsors(id),
        teamService.getTeamsByTournament(id)
      ]);
      setTournament(tourData || null);
      setSponsors(sponsorData || []);
      setTeams(teamData?.data || []);
    } catch (error) {
      console.error("Lỗi lấy dữ liệu tài chính:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchData();
  }, [fetchData]);

  if (isLoading || !tournament) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex gap-4"><Skeleton className="h-10 w-32" /><Skeleton className="h-10 w-32" /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"><Skeleton className="h-28 w-full" /><Skeleton className="h-28 w-full" /><Skeleton className="h-28 w-full" /><Skeleton className="h-28 w-full" /></div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">
      <div className="flex items-center gap-2 mb-6">
        <Wallet className="h-7 w-7 text-sky-600" />
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Tài chính Giải đấu</h1>
      </div>

      <Tabs defaultValue="overview" className="w-full">
     

        <TabsContent value="overview" className="mt-0 focus-visible:outline-none space-y-6">
          <FinanceOverview tournament={tournament} sponsors={sponsors} teams={teams} fetchData={fetchData} />
          <FinanceSponsors tournamentId={id as string} sponsors={sponsors} fetchData={fetchData} />
        </TabsContent>


      </Tabs>
    </div>
  );
}
