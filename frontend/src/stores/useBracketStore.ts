import { create } from "zustand";
import type { BracketTreeNode, TieBreakRule } from "@/types/bracketTree";
import { bracketService } from "@/services/bracketService";

export interface BracketState {
  rootNode: BracketTreeNode | null;
  rules: TieBreakRule[];
  loading: boolean;
  fetchBracketTree: (tournamentId: string) => Promise<void>;
}

export const useBracketStore = create<BracketState>((set) => ({
  rootNode: null,
  rules: [],
  loading: false,

  fetchBracketTree: async (tournamentId) => {
    set({ loading: true });
    try {
      const data = await bracketService.getBracketTreeData(tournamentId);
      set({ rootNode: data.rootNode, rules: data.rules });
    } catch (error) {
      console.error("Lỗi khi tải sơ đồ thi đấu:", error);
    } finally {
      set({ loading: false });
    }
  }
}));