import { getBackendOrgTournaments, mapTournamentMgmt } from "@/services/backendAdapters";
import type { OrgDashboardData, OrgTournament } from "@/types/orgDashboard";

const emptyDashboard = (): OrgDashboardData => ({
  stats: [
    { id: "total", title: "Tổng giải", value: "0", trend: "0", isPositive: true, subtext: "Từ dữ liệu BE", iconType: "trophy" },
    { id: "live", title: "Đang diễn ra", value: "0", trend: "0", isPositive: true, subtext: "Trạng thái playing/actived", iconType: "activity" },
    { id: "teams", title: "Đội đăng ký", value: "0", trend: "0", isPositive: true, subtext: "Chờ BE trả số đăng ký", iconType: "users" },
    { id: "revenue", title: "Doanh thu", value: "0", trend: "0", isPositive: true, subtext: "Chờ BE finance", iconType: "dollar" },
  ],
  revenueData: [],
  sportDistribution: [],
  tournaments: [],
});

export const orgDashboardService = {
  async getDashboardData(): Promise<OrgDashboardData> {
    const tournaments = await getBackendOrgTournaments();
    const mapped = mapTournamentMgmt(tournaments);
    const live = mapped.records.filter((item) => item.status === "Live").length;
    const teams = mapped.records.reduce((sum, item) => sum + item.teamsCount, 0);
    const sports = new Map<string, number>();
    mapped.records.forEach((item) => sports.set(item.sport, (sports.get(item.sport) || 0) + 1));

    return {
      ...emptyDashboard(),
      stats: [
        { id: "total", title: "Tổng giải", value: String(mapped.records.length), trend: "+0", isPositive: true, subtext: "Giải của tổ chức", iconType: "trophy" },
        { id: "live", title: "Đang diễn ra", value: String(live), trend: "+0", isPositive: true, subtext: "Từ trạng thái BE", iconType: "activity" },
        { id: "teams", title: "Đội đăng ký", value: String(teams), trend: "+0", isPositive: true, subtext: "Theo registeredTeams", iconType: "users" },
        { id: "revenue", title: "Doanh thu", value: "0", trend: "+0", isPositive: true, subtext: "BE chưa trả tổng thu", iconType: "dollar" },
      ],
      sportDistribution: Array.from(sports.entries()).map(([name, value], index) => ({
        name,
        value,
        color: ["#ef4444", "#3b82f6", "#22c55e", "#f97316"][index % 4],
      })),
      tournaments: mapped.records.slice(0, 6).map((item): OrgTournament => ({
        id: item.id,
        name: item.name,
        sport: item.sport,
        teamsCount: item.teamsCount,
        season: item.season,
        status: item.status === "Live" ? "Live" : item.status === "Draft" ? "Draft" : "Reg. Open",
        progress: item.registration.max > 0 ? Math.round((item.registration.current / item.registration.max) * 100) : 0,
        detail1: `${item.registration.current}/${item.registration.max || "?"} đội`,
        detail2: item.endDate ? `Kết thúc: ${item.endDate}` : "Chưa có lịch",
      })),
    };
  },
};
