import api from "@/libs/axios";
import type { Participant } from "@/types/participant";
import type { TournamentRecord } from "@/types/orgTournamentMgmt";
import { orgTournamentMgmtService } from "./orgTournamentMgmtService";
import { calculateFeeProgress } from "./orgFinanceCalculator";

export interface OrgReportFilters {
  from?: string;
  to?: string;
  tournamentId?: string;
  sport?: string;
  status?: string;
  kind?: string;
  groupBy?: "day" | "week" | "month" | "year";
}

export interface OrgReportData {
  tournaments: TournamentRecord[];
  summary: {
    totalTournaments: number;
    totalTeams: number;
    totalPlayers: number;
    expectedAmount: number;
    collectedAmount: number;
    approvedTeams: number;
    pendingTeams: number;
    freeTeams: number;
  };
  charts: {
    tournamentsByTime: Array<{ name: string; value: number }>;
    tournamentsByStatus: Array<{ name: string; value: number }>;
    tournamentsBySport: Array<{ name: string; value: number }>;
    tournamentsByKind: Array<{ name: string; value: number }>;
    tournamentsByFormat: Array<{ name: string; value: number }>;
    teamsByTime: Array<{ name: string; value: number }>;
    playersByTime: Array<{ name: string; value: number }>;
    teamApproval: Array<{ name: string; value: number }>;
    revenueByTime: Array<{ name: string; expected: number; collected: number }>;
  };
}

const formatMonth = (value: string) => {
  const date = value ? new Date(value.split("/").reverse().join("-")) : new Date();
  return Number.isNaN(date.getTime()) ? "Chưa rõ" : `${date.getMonth() + 1}/${date.getFullYear()}`;
};

const addCount = (map: Map<string, number>, key: string, value = 1) => map.set(key || "Chưa cập nhật", (map.get(key || "Chưa cập nhật") || 0) + value);
const mapToChart = (map: Map<string, number>) => Array.from(map.entries()).map(([name, value]) => ({ name, value }));

const withinDateRange = (record: TournamentRecord, filters: OrgReportFilters) => {
  if (!filters.from && !filters.to) return true;
  const parts = record.startDate.split("/");
  const date = parts.length === 3 ? new Date(`${parts[2]}-${parts[1]}-${parts[0]}`) : null;
  if (!date || Number.isNaN(date.getTime())) return true;
  if (filters.from && date < new Date(filters.from)) return false;
  if (filters.to && date > new Date(filters.to)) return false;
  return true;
};

export const orgReportsService = {
  async getReports(filters: OrgReportFilters): Promise<OrgReportData> {
    const { records } = await orgTournamentMgmtService.getMgmtData();
    const tournaments = records.filter((record) => {
      if (filters.tournamentId && record.id !== filters.tournamentId && record.tournamentItemId !== filters.tournamentId) return false;
      if (filters.sport && record.sport !== filters.sport) return false;
      if (filters.status && record.status !== filters.status) return false;
      if (filters.kind && record.kind !== filters.kind) return false;
      return withinDateRange(record, filters);
    });

    const participantResults = await Promise.allSettled(
      tournaments
        .filter((record) => record.tournamentItemId || record.id)
        .map(async (record) => {
          const id = record.tournamentItemId || record.id;
          const response = await api.get<{ data: Participant[] }>(`/participants/tournament/${id}`);
          return { record, participants: response.data.data || [] };
        }),
    );

    const statusMap = new Map<string, number>();
    const sportMap = new Map<string, number>();
    const kindMap = new Map<string, number>();
    const formatMap = new Map<string, number>();
    const timeMap = new Map<string, number>();
    const teamsByTimeMap = new Map<string, number>();
    const playersByTimeMap = new Map<string, number>();
    const approvalMap = new Map<string, number>();
    const revenueMap = new Map<string, { expected: number; collected: number }>();

    tournaments.forEach((record) => {
      addCount(statusMap, record.status === "Live" ? "Đang diễn ra" : record.status === "Completed" ? "Hoàn tất" : record.status === "Draft" ? "Bản nháp" : "Mở đăng ký");
      addCount(sportMap, record.sport);
      addCount(kindMap, record.kind === "multi" ? "Hội thao" : "Giải đơn");
      addCount(formatMap, record.format);
      addCount(timeMap, formatMonth(record.startDate));
    });

    let totalTeams = 0;
    let totalPlayers = 0;
    let approvedTeams = 0;
    let pendingTeams = 0;
    let freeTeams = 0;
    let expectedAmount = 0;
    let collectedAmount = 0;

    participantResults.forEach((result) => {
      if (result.status !== "fulfilled") return;
      const { record, participants } = result.value;
      const teamParticipants = participants.filter((item) => item.type === "team");
      const month = formatMonth(record.startDate);
      const fee = calculateFeeProgress(teamParticipants, record.feeEntry || 0);
      totalTeams += teamParticipants.length;
      totalPlayers += fee.totalPlayers || 0;
      approvedTeams += teamParticipants.filter((item) => item.registrationStatus === "approved").length;
      pendingTeams += teamParticipants.filter((item) => item.registrationStatus !== "approved").length;
      freeTeams += teamParticipants.filter((item) => item.paymentStatus === "exempted").length;
      expectedAmount += fee.expectedAmount;
      collectedAmount += fee.collectedAmount;
      addCount(teamsByTimeMap, month, teamParticipants.length);
      addCount(playersByTimeMap, month, fee.totalPlayers || 0);
      addCount(approvalMap, "Đã duyệt", teamParticipants.filter((item) => item.registrationStatus === "approved").length);
      addCount(approvalMap, "Chưa duyệt", teamParticipants.filter((item) => item.registrationStatus !== "approved").length);
      const revenue = revenueMap.get(month) || { expected: 0, collected: 0 };
      revenue.expected += fee.expectedAmount;
      revenue.collected += fee.collectedAmount;
      revenueMap.set(month, revenue);
    });

    return {
      tournaments,
      summary: { totalTournaments: tournaments.length, totalTeams, totalPlayers, expectedAmount, collectedAmount, approvedTeams, pendingTeams, freeTeams },
      charts: {
        tournamentsByTime: mapToChart(timeMap),
        tournamentsByStatus: mapToChart(statusMap),
        tournamentsBySport: mapToChart(sportMap),
        tournamentsByKind: mapToChart(kindMap),
        tournamentsByFormat: mapToChart(formatMap),
        teamsByTime: mapToChart(teamsByTimeMap),
        playersByTime: mapToChart(playersByTimeMap),
        teamApproval: mapToChart(approvalMap),
        revenueByTime: Array.from(revenueMap.entries()).map(([name, value]) => ({ name, ...value })),
      },
    };
  },

  async exportPdf(report: OrgReportData, filters: OrgReportFilters, organizationName: string): Promise<Blob> {
    const response = await api.post("/reports/org/pdf", { report, filters, organizationName }, { responseType: "blob" });
    return response.data;
  },
};
