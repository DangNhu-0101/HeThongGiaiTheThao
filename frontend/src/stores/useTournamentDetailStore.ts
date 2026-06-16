import { create } from "zustand";
import { mockTournamentDetailData, mockTeams, mockRecentResults } from "@/data/mockTournamentDetail";
import { mockSports, mockMatches } from "@/data/mockHomeData";

export interface TournamentDetailState {
  detail: any;
  teams: any[];
  recentResults: any[];
  sports: any[];
  upcomingMatches: any[];
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
  activeTab: "overview", // Tabs: overview, teams, rules, schedule...

  fetchDetail: async (_id) => {
    set({ loading: true });
    // Giả lập API Call
    setTimeout(() => {
      set({ 
        detail: mockTournamentDetailData, 
        teams: mockTeams,
        recentResults: mockRecentResults,
        sports: mockSports,
        upcomingMatches: mockMatches,
        loading: false 
      });
    }, 500);
  },
  setActiveTab: (tab) => set({ activeTab: tab })
}));
