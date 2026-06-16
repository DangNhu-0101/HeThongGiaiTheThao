import { create } from "zustand";
import type { ResultStat, ResultMatchRecord } from "@/types/orgResultMgmt";
import { orgResultMgmtService } from "@/services/orgResultMgmtService";

export interface OrgResultMgmtState {
  stats: ResultStat[];
  matches: ResultMatchRecord[];
  selectedMatchId: string | null;
  loading: boolean;
  fetchData: () => Promise<void>;
  setSelectedMatchId: (id: string | null) => void;
  updateScore: (matchId: string, team: 'teamA' | 'teamB', delta: number) => void;
}

export const useOrgResultMgmtStore = create<OrgResultMgmtState>((set) => ({
  stats: [], matches: [], selectedMatchId: null, loading: false,

  fetchData: async () => {
    set({ loading: true });
    try {
      const data = await orgResultMgmtService.getResultData();
      set({ stats: data.stats, matches: data.matches });
    } catch (error) {
      console.error("Lỗi tải dữ liệu KQ:", error);
    } finally {
      set({ loading: false });
    }
  },

  setSelectedMatchId: (id) => set({ selectedMatchId: id }),

  // Hàm cộng trừ điểm
  updateScore: (matchId, team, delta) => set((state) => ({
    matches: state.matches.map(m => 
      m.id === matchId ? { ...m, [team]: { ...m[team], score: Math.max(0, m[team].score + delta) } } : m
    )
  }))
}));