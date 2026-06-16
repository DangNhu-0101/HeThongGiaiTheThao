import { create } from "zustand";
import type { ScheduleStat, CapacityData, VenueColumn, ScheduleMatchRecord } from "@/types/orgScheduleMgmt";
import { orgScheduleMgmtService } from "@/services/orgScheduleMgmtService";

export interface OrgScheduleMgmtState {
  stats: ScheduleStat[];
  capacity: CapacityData | null;
  venues: VenueColumn[];
  matches: ScheduleMatchRecord[];
  selectedMatchId: string | null;
  loading: boolean;
  fetchData: () => Promise<void>;
  setSelectedMatchId: (id: string | null) => void;
  updateMatchAssignment: (id: string, updates: Partial<ScheduleMatchRecord>) => void;
}

export const useOrgScheduleMgmtStore = create<OrgScheduleMgmtState>((set) => ({
  stats: [], capacity: null, venues: [], matches: [], selectedMatchId: null, loading: false,

  fetchData: async () => {
    set({ loading: true });
    try {
      const data = await orgScheduleMgmtService.getScheduleData();
      set({ stats: data.stats, capacity: data.capacity, venues: data.venues, matches: data.matches });
    } catch (error) {
      console.error("Lỗi tải dữ liệu lịch thi đấu:", error);
    } finally {
      set({ loading: false });
    }
  },

  setSelectedMatchId: (id) => set({ selectedMatchId: id }),

  updateMatchAssignment: (id, updates) => set((state) => ({
    matches: state.matches.map(m => m.id === id ? { ...m, ...updates, status: updates.venue && updates.time ? 'Scheduled' : m.status } : m)
  }))
}));