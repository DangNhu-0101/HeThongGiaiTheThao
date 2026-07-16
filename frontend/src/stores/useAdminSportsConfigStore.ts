import { create } from "zustand";
import type { SportStat, SportRecord, ChartData } from "@/types/adminSportsConfig";
import { adminSportsConfigService } from "@/services/adminSportsConfigService";

export interface AdminSportsConfigState {
  stats: SportStat[];
  sports: SportRecord[];
  usageData: ChartData[];
  formatData: ChartData[];
  selectedSportId: string | null;
  loading: boolean;
  fetchData: () => Promise<void>;
  setSportActive: (sportName: string, active: boolean) => Promise<void>;
  setSelectedSportId: (id: string | null) => void;
}

export const useAdminSportsConfigStore = create<AdminSportsConfigState>((set) => ({
  stats: [], sports: [], usageData: [], formatData: [], selectedSportId: null, loading: false,
  fetchData: async () => {
    set({ loading: true });
    try {
      const data = await adminSportsConfigService.getConfigData();
      set({ stats: data.stats, sports: data.sports, usageData: data.usage, formatData: data.formats });
    } catch (e) {
      console.error(e);
    } finally {
      set({ loading: false });
    }
  },
  setSportActive: async (sportName, active) => {
    await adminSportsConfigService.setSportActive(sportName, active);
    const data = await adminSportsConfigService.getConfigData();
    set({ stats: data.stats, sports: data.sports, usageData: data.usage, formatData: data.formats });
  },
  setSelectedSportId: (id) => set({ selectedSportId: id })
}));
