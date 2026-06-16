import { create } from "zustand";
import type { FeeProgressData, SponsorRecord } from "@/types/orgFinanceMgmt";
import { orgFinanceMgmtService } from "@/services/orgFinanceMgmtService";

export interface OrgFinanceMgmtState {
  feeProgress: FeeProgressData | null;
  sponsors: SponsorRecord[];
  loading: boolean;
  fetchData: () => Promise<void>;
  addSponsor: (sponsor: Omit<SponsorRecord, 'id'>) => void;
  updateSponsor: (id: string, updates: Partial<SponsorRecord>) => void;
  deleteSponsor: (id: string) => void;
}

export const useOrgFinanceMgmtStore = create<OrgFinanceMgmtState>((set) => ({
  feeProgress: null, sponsors: [], loading: false,

  fetchData: async () => {
    set({ loading: true });
    try {
      const data = await orgFinanceMgmtService.getFinanceData();
      set({ feeProgress: data.feeProgress, sponsors: data.sponsors });
    } catch (error) {
      console.error("Lỗi:", error);
    } finally {
      set({ loading: false });
    }
  },

  addSponsor: (sponsor) => set((state) => ({
    sponsors: [...state.sponsors, { ...sponsor, id: `sp_${Date.now()}` }]
  })),

  updateSponsor: (id, updates) => set((state) => ({
    sponsors: state.sponsors.map(sp => sp.id === id ? { ...sp, ...updates } : sp)
  })),

  deleteSponsor: (id) => set((state) => ({
    sponsors: state.sponsors.filter(sp => sp.id !== id)
  }))
}));