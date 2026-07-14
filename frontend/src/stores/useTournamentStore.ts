import { create } from "zustand";
import type { Tournament, Sport } from "@/types/tournament";
import { tournamentService } from "@/services/tournamentService";

export interface TournamentStoreState {
  tournaments: Tournament[];
  sports: Sport[];
  loading: boolean;
  filters: any; // Mở rộng sau khi có logic lọc
  
  fetchAllTournaments: () => Promise<void>;
  setFilters: (filters: any) => void;
}

export const useTournamentStore = create<TournamentStoreState>((set) => ({
  tournaments: [],
  sports: [],
  loading: false,
  filters: {},

  fetchAllTournaments: async () => {
    try {
      set({ loading: true });
      const data = await tournamentService.getAllTournaments();
      set({ 
        tournaments: data.tournaments,
        sports: data.sports 
      });
    } catch (error) {
      console.error("Lỗi tải danh sách giải đấu:", error);
    } finally {
      set({ loading: false });
    }
  },

  setFilters: (newFilters) => set((state) => ({ filters: { ...state.filters, ...newFilters } })),
}));