import { create } from "zustand";
import { orgTournamentMgmtService } from "@/services/orgTournamentMgmtService";
import type { OrgTournamentMgmtStoreState } from "@/types/store";

export const useOrgTournamentMgmtStore = create<OrgTournamentMgmtStoreState>((set, get) => ({
  stats: [],
  records: [],
  loading: false,
  saving: false,

  fetchData: async () => {
    set({ loading: true });
    try {
      const data = await orgTournamentMgmtService.getMgmtData();
      set({ stats: data.stats, records: data.records });
    } catch (error) {
      console.error("Lỗi khi tai dữ liệu quan ly giải đấu:", error);
    } finally {
      set({ loading: false });
    }
  },

  createTournament: async (payload) => {
    set({ saving: true });
    try {
      await orgTournamentMgmtService.createTournament(payload);
      await get().fetchData();
    } finally {
      set({ saving: false });
    }
  },

  updateTournament: async (id, payload) => {
    set({ saving: true });
    try {
      await orgTournamentMgmtService.updateTournament(id, payload);
      await get().fetchData();
    } finally {
      set({ saving: false });
    }
  },

  deleteTournament: async (id, kind) => {
    set({ saving: true });
    try {
      await orgTournamentMgmtService.deleteTournament(id, kind);
      await get().fetchData();
    } finally {
      set({ saving: false });
    }
  },
}));
