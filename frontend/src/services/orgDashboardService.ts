import api from "@/libs/axios";
import { calculateFeeProgress } from "@/services/orgFinanceCalculator";
import { orgTournamentMgmtService } from "@/services/orgTournamentMgmtService";
import type { OrgDashboardData, OrgTournament } from "@/types/orgDashboard";
import type { Participant } from "@/types/participant";
import type { TournamentRecord } from "@/types/orgTournamentMgmt";

const emptyDashboard = (): OrgDashboardData => ({
  stats: [
    { id: "total", title: "Tổng giải", value: "0", trend: "0", isPositive: true, subtext: "Từ dữ liệu hệ thống", iconType: "trophy" },
    { id: "live", title: "Đang diễn ra", value: "0", trend: "0", isPositive: true, subtext: "Theo trạng thái vận hành", iconType: "activity" },
    { id: "teams", title: "Đội đăng ký", value: "0", trend: "0", isPositive: true, subtext: "Tổng đội tham gia", iconType: "users" },
    { id: "revenue", title: "Doanh thu", value: "0 đ", trend: "0", isPositive: true, subtext: "Từ lệ phí đã ghi nhận", iconType: "dollar" },
  ],
  revenueData: [],
  sportDistribution: [],
  tournaments: [],
});

const formatCurrency = (value: number) => `${Math.round(value).toLocaleString("vi-VN")} đ`;

const monthLabel = (value?: string) => {
  if (!value) return "Chưa cập nhật";
  const parts = value.split("/");
  const date = parts.length === 3 ? new Date(`${parts[2]}-${parts[1]}-${parts[0]}`) : new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa cập nhật";
  return `${date.getMonth() + 1}/${date.getFullYear()}`;
};

const itemInputs = (record: TournamentRecord) => {
  const items = record.kind === "multi" && record.rawTournamentItems?.length
    ? record.rawTournamentItems
    : [{ id: record.tournamentItemId || record.id, feeEntry: record.feeEntry || 0 }];

  return items
    .map((item) => ({ id: item.id, feeEntry: Number(item.feeEntry || record.feeEntry || 0) }))
    .filter((item) => item.id);
};

const readCollectedRevenue = async (record: TournamentRecord) => {
  const results = await Promise.allSettled(itemInputs(record).map(async (item) => {
    const response = await api.get<{ data: Participant[] }>(`/participants/tournament/${item.id}`);
    return calculateFeeProgress(response.data.data || [], item.feeEntry).collectedAmount;
  }));

  return results.reduce((sum, result) => result.status === "fulfilled" ? sum + result.value : sum, 0);
};

const toDashboardStatus = (status: TournamentRecord["status"]): OrgTournament["status"] => {
  if (status === "Live") return "Live";
  if (status === "Draft") return "Draft";
  return "Reg. Open";
};

export const orgDashboardService = {
  async getDashboardData(): Promise<OrgDashboardData> {
    const mapped = await orgTournamentMgmtService.getMgmtData();
    const records = await Promise.all(mapped.records.map(async (record) => ({
      ...record,
      collectedRevenue: await readCollectedRevenue(record),
    })));

    const live = records.filter((item) => item.status === "Live").length;
    const teams = records.reduce((sum, item) => sum + item.teamsCount, 0);
    const totalRevenue = records.reduce((sum, item) => sum + item.collectedRevenue, 0);
    const sports = new Map<string, number>();
    const revenueByMonth = new Map<string, number>();

    records.forEach((item) => {
      sports.set(item.sport, (sports.get(item.sport) || 0) + item.teamsCount);
      const month = monthLabel(item.startDate);
      revenueByMonth.set(month, (revenueByMonth.get(month) || 0) + item.collectedRevenue);
    });

    return {
      ...emptyDashboard(),
      stats: [
        { id: "total", title: "Tổng giải", value: String(records.length), trend: "+0", isPositive: true, subtext: "Giải của tổ chức", iconType: "trophy" },
        { id: "live", title: "Đang diễn ra", value: String(live), trend: "+0", isPositive: true, subtext: "Theo trạng thái vận hành", iconType: "activity" },
        { id: "teams", title: "Đội đăng ký", value: String(teams), trend: "+0", isPositive: true, subtext: "Tổng đội tham gia", iconType: "users" },
        { id: "revenue", title: "Doanh thu", value: formatCurrency(totalRevenue), trend: "+0", isPositive: true, subtext: "Từ lệ phí VĐV đã ghi nhận", iconType: "dollar" },
      ],
      revenueData: Array.from(revenueByMonth.entries()).map(([name, value]) => ({ name, value })),
      sportDistribution: Array.from(sports.entries()).map(([name, value], index) => ({
        name,
        value,
        color: ["#325978", "#A7CADF", "#730F1A", "#22C55E"][index % 4],
      })),
      tournaments: records.slice(0, 6).map((item): OrgTournament => ({
        id: item.id,
        name: item.name,
        sport: item.sport,
        teamsCount: item.teamsCount,
        season: item.season,
        status: toDashboardStatus(item.status),
        progress: item.registration.max > 0 ? Math.round((item.registration.current / item.registration.max) * 100) : 0,
        detail1: `${item.registration.current}/${item.registration.max || "?"} đội`,
        detail2: item.endDate ? `Kết thúc: ${item.endDate}` : "Chưa có lịch",
      })),
    };
  },
};
