import { create } from "zustand";
import type { FeeProgressData, SponsorPackage, SponsorRecord } from "@/types/orgFinanceMgmt";
import { orgFinanceMgmtService } from "@/services/orgFinanceMgmtService";

export interface OrgFinanceMgmtState {
  feeProgress: FeeProgressData | null;
  sponsors: SponsorRecord[];
  sponsorPackages: SponsorPackage[];
  tournamentItemId: string;
  loading: boolean;
  fetchData: (tournamentItemId?: string) => Promise<void>;
  addSponsor: (sponsor: Omit<SponsorRecord, "id">) => Promise<void>;
  updateSponsor: (id: string, updates: Partial<SponsorRecord>) => Promise<void>;
  deleteSponsor: (id: string) => Promise<void>;
}

export const useOrgFinanceMgmtStore = create<OrgFinanceMgmtState>((set, get) => ({
  feeProgress: null,
  sponsors: [],
  sponsorPackages: [],
  tournamentItemId: "",
  loading: false,

  fetchData: async (tournamentItemId) => {
    set({ loading: true });
    try {
      const data = await orgFinanceMgmtService.getFinanceData(tournamentItemId);
      set({
        feeProgress: data.feeProgress,
        sponsors: data.sponsors,
        sponsorPackages: data.sponsorPackages,
        tournamentItemId: tournamentItemId || "",
      });
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu tài trợ:", error);
    } finally {
      set({ loading: false });
    }
  },

  addSponsor: async (sponsor) => {
    const tournamentItemId = get().tournamentItemId;
    if (!tournamentItemId) throw new Error("Vui lòng chọn giải trước khi thêm nhà tài trợ.");
    await orgFinanceMgmtService.createSponsor(tournamentItemId, sponsor);
    await get().fetchData(tournamentItemId);
  },

  updateSponsor: async (id, updates) => {
    await orgFinanceMgmtService.updateSponsor(id, updates);
    await get().fetchData(get().tournamentItemId);
  },

  deleteSponsor: async (id) => {
    await orgFinanceMgmtService.deleteSponsor(id);
    await get().fetchData(get().tournamentItemId);
  },
}));
