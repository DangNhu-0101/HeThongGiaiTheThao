import { create } from "zustand";
import type { TeamMgmtStat, OrgTeamRecord } from "@/types/orgTeamMgmt";
import { orgTeamMgmtService } from "@/services/orgTeamMgmtService";

export interface OrgTeamMgmtState {
  stats: TeamMgmtStat[];
  records: OrgTeamRecord[];
  tournamentItemId: string;
  loading: boolean;
  fetchData: (tournamentItemId?: string) => Promise<void>;
  toggleFeeExempt: (teamId: string) => Promise<void>;
  approveTeam: (teamId: string) => Promise<void>;
  rejectTeam: (teamId: string) => Promise<void>;
  addTeamByOrganization: (payload: {
    name: string;
    representative?: { name?: string; phone?: string; email?: string };
    athletes?: Array<{ name: string; birthDate?: string; gender?: string; skill?: number }>;
    paymentStatus?: "paid" | "unpaid" | "exempted";
    source?: "organization" | "import";
  }) => Promise<void>;
  importTeamsFromFile: (file: File) => Promise<{
    message?: string;
    loginFile?: { fileName: string; mimeType: string; base64: string };
  }>;
}

export const useOrgTeamMgmtStore = create<OrgTeamMgmtState>((set, get) => ({
  stats: [],
  records: [],
  tournamentItemId: "",
  loading: false,

  fetchData: async (tournamentItemId) => {
    set({ loading: true });
    try {
      const data = await orgTeamMgmtService.getTeamData(tournamentItemId);
      set({ stats: data.stats, records: data.records, tournamentItemId: tournamentItemId || "" });
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu đội:", error);
    } finally {
      set({ loading: false });
    }
  },

  toggleFeeExempt: async (teamId) => {
    const team = get().records.find((item) => item.id === teamId);
    const nextStatus = team?.paymentStatus === "exempted" ? "unpaid" : "exempted";
    await orgTeamMgmtService.updatePayment(teamId, nextStatus);
    if (nextStatus === "exempted") {
      await orgTeamMgmtService.reviewTeam(teamId, "approved");
    }
    await get().fetchData(get().tournamentItemId);
  },

  approveTeam: async (teamId) => {
    await orgTeamMgmtService.reviewTeam(teamId, "approved");
    await get().fetchData(get().tournamentItemId);
  },

  rejectTeam: async (teamId) => {
    await orgTeamMgmtService.reviewTeam(teamId, "rejected");
    await get().fetchData(get().tournamentItemId);
  },

  addTeamByOrganization: async (payload) => {
    const tournamentItemId = get().tournamentItemId;
    if (!tournamentItemId) throw new Error("Vui lòng chọn giải trước khi thêm đội.");
    await orgTeamMgmtService.createTeamByOrganization({ ...payload, tournamentItemId });
    await get().fetchData(tournamentItemId);
  },

  importTeamsFromFile: async (file) => {
    const tournamentItemId = get().tournamentItemId;
    if (!tournamentItemId) throw new Error("Vui lòng chon giai truoc khi nhap file.");
    const result = await orgTeamMgmtService.importTeamsFromFile(tournamentItemId, file);
    await get().fetchData(tournamentItemId);
    return result;
  },
}));
