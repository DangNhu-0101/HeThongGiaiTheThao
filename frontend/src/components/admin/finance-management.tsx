import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet } from "lucide-react";
import { tournamentService } from "@/services/tournamentService";
import { financeService } from "@/services/financeService";
import { FinanceOverview } from "@/components/finance/FinanceOverview";
import { FinanceSponsors } from "@/components/finance/FinanceSponsors";




export interface SponsorContact {
  name: string;
  phone: string;
  email: string;
}

export interface Sponsor {
  _id: string;
  name: string;
  amount: number;
  sponsorType: string;
  sponsorshipType: string;
  website: string;
  contactPerson?: SponsorContact;
  status: string;
}

export interface Tournament {
  _id: string;

  sportsConfig?: {
    feeEntry?: number;
    feePerAthlete?: number;
    maxTeams?: number;
  }[];
}

export default function FinanceDashboard() {
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!id) return;
    await Promise.resolve();
    setIsLoading(true);
    try {
      const [tourData, sponsorData] = await Promise.all([
        tournamentService.getById(id),
        financeService.getSponsors(id),
      ]);
      setTournament(tourData || null);
      setSponsors(sponsorData || []);
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
        <TabsList className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 h-auto mb-6">
          <TabsTrigger value="overview" className="px-6 py-2.5 rounded-lg font-bold data-[state=active]:bg-sky-600 data-[state=active]:text-white">📊 Tổng quan</TabsTrigger>
          <TabsTrigger value="sponsors" className="px-6 py-2.5 rounded-lg font-bold data-[state=active]:bg-sky-600 data-[state=active]:text-white">🏢 Nhà tài trợ</TabsTrigger>
          <TabsTrigger value="transactions" className="px-6 py-2.5 rounded-lg font-bold data-[state=active]:bg-sky-600 data-[state=active]:text-white">💰 Giao dịch</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0 focus-visible:outline-none">
          <FinanceOverview tournament={tournament} sponsors={sponsors} />
        </TabsContent>

        <TabsContent value="sponsors" className="mt-0 focus-visible:outline-none">
          <FinanceSponsors tournamentId={id as string} sponsors={sponsors} fetchData={fetchData} />
        </TabsContent>

  
      </Tabs>
    </div>
  );
}
