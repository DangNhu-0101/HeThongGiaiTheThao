import { create } from "zustand";
import type { Tournament, Sport } from "@/types/tournament";
import { tournamentService } from "@/services/tournamentService";

export interface TournamentStoreState {
  tournaments: Tournament[];
  sports: Sport[];
  loading: boolean;
  error: string | null;
  filters: Record<string, unknown>;
  fetchAllTournaments: (filters?: Record<string, unknown>) => Promise<void>;
  setFilters: (filters: Record<string, unknown>) => void;
}

export const useTournamentStore = create<TournamentStoreState>((set) => ({
  tournaments: [],
  sports: [],
  loading: false,
  error: null,
  filters: {},

  fetchAllTournaments: async (filters = {}) => {
    try {
      set({ loading: true, error: null, filters });
      const data = await tournamentService.getAllTournaments(filters);
      set({
        tournaments: data.tournaments,
        sports: data.sports,
      });
    } catch (error) {
      console.error("Lỗi tải danh sách giải đấu:", error);
      set({ error: "Không thể tải danh sách giải đấu. Vui lòng thử lại." });
    } finally {
      set({ loading: false });
    }
  },

  setFilters: (newFilters) => set((state) => ({ filters: { ...state.filters, ...newFilters } })),
}));
