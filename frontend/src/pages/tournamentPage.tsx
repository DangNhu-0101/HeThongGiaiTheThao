import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/api/axiosConfig";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  status: "upcoming" | "ongoing" | "Actived" | "playing" | "completed" | "cancelled";
  sportType?: string[];
  sportsConfig?: {
    sport: string;
    sportName?: string;
    feeEntry?: number;
    feePerAthlete?: number;
    maxTeams?: number | null;
    categories: string[];
  }[];
  bannerUrl?: string;
  videoUrl?: string;
  slogan?: string;
  venue?: string;
  location?: string;
  targetAudience?: string;
  organization?: {
    orgName?: string;
    name?: string;
    contactPerson?: string;
    contactEmail?: string;
    contactPhone?: string;
  };
  organizer?: unknown;
  contactPerson?: {
    name?: string;
    phone?: string;
  };
  prizes?: string;
  description?: string;
  rules?: string;
  timeLine?: {
    registrationStart?: string;
    registrationEnd?: string;
    tournamentStart?: string;
    tournamentEnd?: string;
  };
  galaConfig?: {
    hasGala?: boolean;
    time?: string;
  };
  registrationFormUrl?: string;
  registrationNote?: string;
  zaloGroupNote?: string;
  bankTransferContent?: string;
  paymentNote?: string;
  formatDescription?: string;
  ruleDescription?: string;
  contacts?: {
    name?: string;
    phone?: string;
  }[];
}

export interface TournamentRuleInfo {
  formatDescription?: string;
  ruleDescription?: string;
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

const itgvtPublicInfo: Partial<Tournament> = {
  name: "ITGVT Pickleball Tournament 2026 - Season 2",
  displayName: "ITGVT Pickleball Tournament 2026 - Season 2",
  slogan: "Dân IT chuyển mình bứt phá mọi giới hạn",
  venue: "Sân WinPick - 29/10 Xô Viết Nghệ Tĩnh, Vũng Tàu",
  location: "Sân WinPick - 29/10 Xô Viết Nghệ Tĩnh, Vũng Tàu",
  targetAudience:
    "Thành viên ITGVT, bạn bè thành viên trong ngành IT tại Bà Rịa - Vũng Tàu (cũ), khách mời, nhà tài trợ được xác minh bởi BTC.",
  description:
    "Giao lưu thể thao cây nhà lá vườn của ITGVT, tăng tính kết nối của anh em cùng nhóm ngành IT và chia sẻ công nghệ trong địa bàn tỉnh Bà Rịa - Vũng Tàu (cũ).",
  organization: { orgName: "ITGVT", name: "ITGVT" },
  timeLine: {
    registrationStart: "2026-05-06T17:00:00.000Z",
    registrationEnd: "2026-05-13T16:59:00.000Z",
    tournamentStart: "2026-06-06T07:00:00.000Z",
    tournamentEnd: "2026-06-06T10:30:00.000Z",
  },
  sportsConfig: [
    {
      sport: "Pickleball",
      sportName: "Pickleball",
      feeEntry: 500000,
      feePerAthlete: 500000,
      maxTeams: 24,
      categories: ["MD", "WD", "XD"],
    },
  ],
  registrationFormUrl: "https://forms.gle/5Z1noqaLtBUdyHGu8",
  zaloGroupNote: "Zalo group cho giải đấu sẽ được tạo sau khi gom đủ thành viên.",
  bankTransferContent: "ITGVT Pickleball_Tên VĐV_Số điện thoại",
  paymentNote: "Sau khi chuyển khoản các VĐV vui lòng thông báo Ban Tổ chức để xác nhận.",
  contactPerson: {
    name: "Mr. Duy, Mr. Tín",
    phone: "Mr. Duy: 0984 465 755, Mr. Tín: 0912 822 002",
  },
  contacts: [
    { name: "Mr. Duy", phone: "0984 465 755" },
    { name: "Mr. Tín", phone: "0912 822 002" },
  ],
  formatDescription: `24 cặp, 6 bảng, mỗi bảng 4 cặp thi đấu vòng tròn 1 lượt.
Trận thắng tính 1 điểm, thua 0 điểm trong suốt giải đấu.
Nếu bằng điểm sẽ tính hiệu số, sau đó xét đối đầu trực tiếp, cuối cùng bốc thăm.
12 đội Nhất và Nhì bảng vào Serie A: vòng 1/8, Tứ kết, Bán kết, Chung kết.
12 đội Ba và Tư bảng vào Serie B: vòng 1/8, Tứ kết, Bán kết, Chung kết.
Tại vòng 1/8 sẽ chọn 8 cặp vào Tứ kết gồm 6 cặp thắng và 2 cặp thua có thành tích tốt nhất tính từ vòng bảng.
Từ vòng bảng đến Tứ kết thi đấu 1 hiệp chạm 11 điểm, 6 điểm đổi sân; Bán kết và Chung kết thi đấu 1 hiệp chạm 15 điểm, 8 điểm đổi sân.`,
  ruleDescription: `Vắng mặt quá 10 phút sau giờ thi đấu: xử thua với tỉ số tối đa 0-11 hoặc 0-15 tùy vòng đấu.
Đội tham gia có thể yêu cầu dừng trận vì lý do bất khả kháng nhưng sẽ xử thua trận hiện hành với tỉ số 0-11.
Mỗi đội có quyền call break time 1 lần/trận, tối đa 3 phút.
Trang phục thi đấu: Áo của giải.
Trọng tài: Công tác trọng tài bảng sẽ do đơn vị thứ 3 phụ trách do BTC thuê.

Anh em có thể trao đổi với trọng tài nhưng quyết định cuối cùng vẫn thuộc về trọng tài.

Trên tinh thần fairplay, tôn trọng, anh em tự giác nhận foul hoặc có thể trao đổi để serve lại. Không chấp nhận yêu cầu đổi trọng tài khi trận đấu đang diễn ra.`,
};

const withTournamentPublicInfo = (tournament: Tournament): Tournament => {
  const normalizedName = `${tournament.name || ""} ${tournament.displayName || ""}`.toLowerCase();
  const isItgvtSeason2 =
    tournament._id === "6a048b70ce7de835f7b28bd6" ||
    (normalizedName.includes("pickleball") && normalizedName.includes("season 2") && /itv?tg|itgvt/.test(normalizedName));

  if (!isItgvtSeason2) return tournament;

  return {
    ...tournament,
    ...itgvtPublicInfo,
    _id: tournament._id,
    status: tournament.status,
    sportType: tournament.sportType,
    bannerUrl: tournament.bannerUrl,
    videoUrl: tournament.videoUrl,
    prizes: tournament.prizes,
    galaConfig: tournament.galaConfig,
  };
};

export function TournamentPage() {
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [topTeams, setTopTeams] = useState<Team[]>([]);
  const [ruleInfo, setRuleInfo] = useState<TournamentRuleInfo | null>(null);
  const [sponsors] = useState<Sponsor[]>([]);
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
        setError(null);

        const tourRes = await api.get(`/tournaments/${id}`);
        const [teamsRes, stageRes] = await Promise.all([
          api.get(`/tournaments/${id}/teams`).catch(() => ({ data: { data: [] } })),
          api.get(`/stages/get-stages/${id}`).catch(() => ({ data: { rule: null } })),
        ]);

        if (!isMounted) return;

        const tournamentData = tourRes.data?.data || null;
        setTournament(tournamentData ? withTournamentPublicInfo(tournamentData) : null);
        setRuleInfo(stageRes.data?.rule || null);

        const teamsData = teamsRes.data?.data || [];
        const sortedTeams = [...teamsData].sort((a: Team, b: Team) => (b.points || 0) - (a.points || 0));
        setTopTeams(sortedTeams.slice(0, 5));
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
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Skeleton className="h-[400px] w-full rounded-none" />
        <div className="mx-auto w-full max-w-5xl space-y-6 p-8">
          <Skeleton className="mx-auto h-12 w-64" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="space-y-4 text-center">
          <Trophy className="mx-auto h-16 w-16 text-slate-300" />
          <h2 className="text-2xl font-bold text-slate-700">Không tìm thấy giải đấu</h2>
          <p className="text-slate-500">{error || "Giải đấu không tồn tại hoặc đã bị xóa."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col">
      <HomeHero tournament={tournament} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {isMobile ? (
            <div className="mb-8 w-full px-1">
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="h-12 w-full rounded-xl border-none bg-slate-100 font-semibold text-sky-700 shadow-sm">
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
            <div className="no-scrollbar mb-8 w-full overflow-x-auto pb-2">
              <TabsList className="mx-auto flex h-auto w-max min-w-full gap-1 rounded-2xl bg-slate-100 p-1.5 sm:min-w-0 sm:justify-center sm:gap-2">
                <TabsTrigger value="info" className="rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all data-[state=active]:bg-white data-[state=active]:text-sky-600 data-[state=active]:shadow-sm sm:px-6">
                  Thông tin
                </TabsTrigger>
                <TabsTrigger value="results" className="rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all data-[state=active]:bg-white data-[state=active]:text-sky-600 data-[state=active]:shadow-sm sm:px-6">
                  Kết quả thi đấu
                </TabsTrigger>
                <TabsTrigger value="teams" className="rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all data-[state=active]:bg-white data-[state=active]:text-sky-600 data-[state=active]:shadow-sm sm:px-6">
                  Danh sách đội
                </TabsTrigger>
              </TabsList>
            </div>
          )}

          <TabsContent value="info" className="m-0 focus-visible:outline-none">
            {sponsors.length > 0 && (
              <div className="my-10 rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm">
                <h3 className="mb-6 text-sm font-bold tracking-widest text-slate-400 uppercase">Được tài trợ bởi</h3>
                <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
                  {sponsors.map((sponsor) => (
                    <div key={sponsor._id} className="group relative">
                      <img
                        src={`http://localhost:5001/${sponsor.logo.replace(/\\/g, "/")}`}
                        alt={sponsor.name}
                        className="h-16 max-w-[150px] object-contain opacity-70 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0 md:h-20"
                      />
                      {sponsor.sponsorType && (
                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold whitespace-nowrap text-slate-400 opacity-0 transition-opacity group-hover:opacity-100">
                          {sponsor.sponsorType}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <HomeOverview tournament={tournament} ruleInfo={ruleInfo} />
          </TabsContent>

          <TabsContent value="results" className="m-0 focus-visible:outline-none">
            <div className="rounded-2xl border border-slate-100 bg-white p-2 shadow-sm sm:p-6">
              <TournamentResults tournamentId={tournament._id} />
            </div>
          </TabsContent>

          <TabsContent value="teams" className="m-0 focus-visible:outline-none">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="rounded-t-xl border-b border-slate-100 bg-slate-50">
                <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                  <Users className="h-5 w-5 text-sky-600" />
                  Danh sách đội thi đấu
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {topTeams.length === 0 ? (
                  <p className="py-8 text-center text-slate-500">Chưa có dữ liệu đội thi đấu.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {topTeams.map((team, idx) => (
                      <div key={team._id || idx} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 transition-all hover:shadow-md">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600">
                          {idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold text-slate-800">
                            {typeof team.name === "string" ? team.name : (team.name as { name?: string })?.name || team.teamCode || `Đội ${idx + 1}`}
                          </p>
                          <p className="truncate text-xs text-slate-500">{team.sportCategory || team.sportType || "Chưa phân loại"}</p>
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
    </div>
  );
}

export default TournamentPage;
