import { create } from "zustand";
import { getBackendTournamentDetail } from "@/services/backendAdapters";
import type { Match, MatchResult, Sport, Team, TournamentDetail } from "@/types/tournament";

export interface TournamentDetailState {
  detail: TournamentDetail | null;
  teams: Team[];
  recentResults: MatchResult[];
  sports: Sport[];
  upcomingMatches: Match[];
  loading: boolean;
  activeTab: string;
  fetchDetail: (id: string) => Promise<void>;
  setActiveTab: (tab: string) => void;
}

export const useTournamentDetailStore = create<TournamentDetailState>((set) => ({
  detail: null,
  teams: [],
  recentResults: [],
  sports: [],
  upcomingMatches: [],
  loading: false,
  activeTab: "overview",

  fetchDetail: async (id) => {
    set({ loading: true });
    try {
      const data = await getBackendTournamentDetail(id);
      set({
        detail: data.detail,
        teams: data.teams,
        recentResults: data.recentResults,
        sports: data.sports,
        upcomingMatches: data.upcomingMatches,
        loading: false,
      });
    } catch (error) {
      console.warn("Không thể tai chi tiet giải đấu.", error);
      set({
        detail: null,
        teams: [],
        recentResults: [],
        sports: [],
        upcomingMatches: [],
        loading: false,
      });
    }
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
}));
