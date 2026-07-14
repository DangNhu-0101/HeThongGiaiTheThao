import { create } from "zustand";
import { standingsService } from "@/services/standingsService";
import type { GroupStanding, TopPerformer } from "@/types/standing";

export interface StandingsState {
  groups: GroupStanding[];
  topScorers: TopPerformer[];
  topAssists: TopPerformer[];
  loading: boolean;
  error: string | null;
  fetchStandings: (tournamentId: string) => Promise<void>;
}

export const useStandingsStore = create<StandingsState>((set) => ({
  groups: [],
  topScorers: [],
  topAssists: [],
  loading: false,
  error: null,

  fetchStandings: async (tournamentId) => {
    set({ loading: true, error: null });
    try {
      const data = await standingsService.getStandingsData(tournamentId);
      set({
        groups: data.groups,
        topScorers: data.topScorers,
        topAssists: data.topAssists,
        error: null,
      });
    } catch (error) {
      console.error("Không thể tai bảng xếp hạng", error);
      set({
        groups: [],
        topScorers: [],
        topAssists: [],
        error: "Không thể tai bảng xếp hạng. Vui lòng thử lại sau.",
      });
    } finally {
      set({ loading: false });
    }
  },
}));
