import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/api/axiosConfig";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { HomeHero } from "@/components/tournament-home/HomeHero";
import { HomeOverview } from "@/components/tournament-home/HomeOverview";
import { TournamentResults } from "@/components/tournament-home/TournamentResults";
import { Trophy, Users } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Sponsor } from "@/types/sponsor";


export interface Tournament {
  _id: string;
  name: string;
  displayName?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  sportType?: string[];
  sportsConfig?: { sport: string; categories: string[] }[];
  bannerUrl?: string;
  videoUrl?: string;
  slogan?: string;
  venue?: string;
  location?: string;
  targetAudience?: string;
  organizer?: unknown;
  contactPerson?: unknown;
  prizes?: string;
  description?: string;
  rules?: string;
  timeLine?: {
    registrationStart?: string;
    tournamentStart?: string;
    tournamentEnd?: string;
  };
  galaConfig?: {
    hasGala?: boolean;
    time?: string;
  };
}

export interface Team {
  _id: string;
  name: unknown;
  teamCode?: string;
  sportCategory?: string;
  sportType?: string;
  points?: number;
}

export interface Match {
  _id: string;
  courtId?: { name: string };
  round?: number | string;
  team1?: { name: string };
  team2?: { name: string };
  team1Score?: number;
  team2Score?: number;
}


export function TournamentPage() {
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [topTeams, setTopTeams] = useState<Team[]>([]);
  const [sponsors ] = useState<Sponsor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("info");

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // 1. Fetch thông tin giải đấu (Bắt buộc)
        const tourRes = await api.get(`/tournaments/${id}`);
        
        // 2. Fetch danh sách Đội (Tùy chọn, thêm .catch để bỏ qua lỗi nếu API chưa có)
        const teamsRes = await api.get(`/tournaments/${id}/teams`).catch(() => ({ data: { data: [] } }));

        if (isMounted) {
          setTournament(tourRes.data?.data || null);
          
          const teamsData = teamsRes.data?.data || [];
          const sortedTeams = [...teamsData].sort((a: Team, b: Team) => (b.points || 0) - (a.points || 0));
          setTopTeams(sortedTeams.slice(0, 5));
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error("Lỗi khi tải dữ liệu public home", err);
          setError("Không thể tải thông tin giải đấu.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void fetchData();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Skeleton className="h-[400px] w-full rounded-none" />
        <div className="max-w-5xl mx-auto w-full p-8 space-y-6">
          <Skeleton className="h-12 w-64 mx-auto" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <Trophy className="h-16 w-16 text-slate-300 mx-auto" />
          <h2 className="text-2xl font-bold text-slate-700">Không tìm thấy giải đấu</h2>
          <p className="text-slate-500">{error || "Giải đấu không tồn tại hoặc đã bị xóa."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      <HomeHero tournament={tournament} />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {isMobile ? (
            <div className="mb-8 px-1 w-full">
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="w-full rounded-xl bg-slate-100 border-none font-semibold text-sky-700 h-12 shadow-sm">
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Thông tin</SelectItem>
                  <SelectItem value="results">Kết quả thi đấu</SelectItem>
                  <SelectItem value="teams">Danh sách đội</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="w-full overflow-x-auto no-scrollbar mb-8 pb-2">
              <TabsList className="bg-slate-100 p-1.5 rounded-2xl h-auto flex w-max mx-auto min-w-full sm:min-w-0 sm:justify-center gap-1 sm:gap-2">
                <TabsTrigger value="info" className="px-4 sm:px-6 py-2.5 rounded-xl font-semibold text-sm data-[state=active]:bg-white data-[state=active]:text-sky-600 data-[state=active]:shadow-sm transition-all whitespace-nowrap">
                  Thông tin
                </TabsTrigger>
                <TabsTrigger value="results" className="px-4 sm:px-6 py-2.5 rounded-xl font-semibold text-sm data-[state=active]:bg-white data-[state=active]:text-sky-600 data-[state=active]:shadow-sm transition-all whitespace-nowrap">
                  Kết quả thi đấu
                </TabsTrigger>
                <TabsTrigger value="teams" className="px-4 sm:px-6 py-2.5 rounded-xl font-semibold text-sm data-[state=active]:bg-white data-[state=active]:text-sky-600 data-[state=active]:shadow-sm transition-all whitespace-nowrap">
                  Danh sách đội
                </TabsTrigger>
              </TabsList>
            </div>
          )}

          <TabsContent value="info" className="m-0 focus-visible:outline-none">
            {/* Render danh sách nhà tài trợ dạng Logo Grid */}
            {sponsors.length > 0 && (
              <div className="my-10 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Được tài trợ bởi</h3>
                <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
                  {sponsors.map(sponsor => (
                    <div key={sponsor._id} className="group relative">
                      <img 
                        src={`http://localhost:5001/${sponsor.logo.replace(/\\/g, '/')}`} 
                        alt={sponsor.name} 
                        className="h-16 md:h-20 max-w-[150px] object-contain opacity-70 grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-300"
                      />
                      {sponsor.sponsorType && (
                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {sponsor.sponsorType}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <HomeOverview tournament={tournament} />
          </TabsContent>

          <TabsContent value="results" className="m-0 focus-visible:outline-none">
            <div className="bg-white rounded-2xl p-2 sm:p-6 border border-slate-100 shadow-sm">
               <TournamentResults tournamentId={tournament._id} />
            </div>
          </TabsContent>

          <TabsContent value="teams" className="m-0 focus-visible:outline-none">
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-xl">
                <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                  <Users className="h-5 w-5 text-sky-600" />
                  Danh sách Đội thi đấu
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {topTeams.length === 0 ? (
                   <p className="text-center text-slate-500 py-8">Chưa có dữ liệu đội thi đấu.</p>
                ) : (
                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                     {topTeams.map((team, idx) => (
                        <div key={team._id || idx} className="flex items-center gap-3 p-4 border border-slate-100 rounded-xl hover:shadow-md transition-all bg-white">
                           <div className="h-10 w-10 bg-slate-100 text-slate-600 font-bold flex items-center justify-center rounded-full shrink-0">
                             {idx + 1}
                           </div>
                           <div className="flex-1 overflow-hidden">
                             <p className="font-bold text-slate-800 truncate">
                               {typeof team.name === 'string' ? team.name : (team.name as {name?: string})?.name || team.teamCode || `Đội ${idx + 1}`}
                             </p>
                             <p className="text-xs text-slate-500 truncate">{team.sportCategory || team.sportType || 'Chưa phân loại'}</p>
                           </div>
                        </div>
                     ))}
                   </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </main>

      {/* Marquee Animation logic directly mapped to index */}
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-33.33%); }
        }
      `}</style>
    </div>
  );
}
export default TournamentPage;