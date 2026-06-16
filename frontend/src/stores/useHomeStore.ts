import { create } from "zustand";
import type { HomeState } from "@/types/store";
import { homeService } from "@/services/homeService";

export const useHomeStore = create<HomeState>((set) => ({
  tournaments: [],
  upcomingMatches: [],
  sports: [],
  loading: false,

  fetchHomeData: async () => {
    try {
      set({ loading: true });
      const data = await homeService.getHomeData();
      set({ 
        tournaments: data.tournaments, 
        upcomingMatches: data.matches,
        sports: data.sports 
      });
    } catch (error) {
      console.error("Lỗi tải trang chủ", error);
    } finally {
      set({ loading: false });
    }
  },
}));