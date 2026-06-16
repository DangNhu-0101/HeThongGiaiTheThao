import { create } from "zustand";
import type { GroupStanding, TopPerformer } from "@/types/standing";
import { standingsService } from "@/services/standingsService";

export interface StandingsState {
  groups: GroupStanding[];
  topScorers: TopPerformer[];
  topAssists: TopPerformer[];
  loading: boolean;
  fetchStandings: (tournamentId: string) => Promise<void>;
}

export const useStandingsStore = create<StandingsState>((set) => ({
  groups: [],
  topScorers: [],
  topAssists: [],
  loading: false,

  fetchStandings: async (tournamentId) => {
    set({ loading: true });
    try {
      const data = await standingsService.getStandingsData(tournamentId);
      set({ 
        groups: data.groups, 
        topScorers: data.topScorers, 
        topAssists: data.topAssists 
      });
    } catch (error) {
      console.error("Lỗi khi tải bảng xếp hạng", error);
    } finally {
      set({ loading: false });
    }
  }
}));