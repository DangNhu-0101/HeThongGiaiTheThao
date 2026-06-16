import { create } from "zustand";
import type { MatchDetailData } from "@/types/matchDetail";
import { matchDetailService } from "@/services/matchDetailService";

export interface MatchDetailState {
  matchData: MatchDetailData | null;
  loading: boolean;
  activeTab: string;
  fetchMatchDetail: (matchId: string) => Promise<void>;
  setActiveTab: (tab: string) => void;
}

export const useMatchDetailStore = create<MatchDetailState>((set) => ({
  matchData: null,
  loading: false,
  activeTab: "overview",

  fetchMatchDetail: async (matchId) => {
    set({ loading: true });
    try {
      const data = await matchDetailService.getMatchDetail(matchId);
      set({ matchData: data });
    } catch (error) {
      console.error("Lỗi khi tải chi tiết trận đấu", error);
    } finally {
      set({ loading: false });
    }
  },
  setActiveTab: (tab) => set({ activeTab: tab })
}));