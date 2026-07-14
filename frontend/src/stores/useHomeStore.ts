import { create } from "zustand";
import type { HomeState } from "@/types/store";
import { getApiErrorMessage } from "@/libs/axios";
import { homeService } from "@/services/homeService";

const emptyStats = {
  ongoingTournaments: 0,
  totalTeams: 0,
  totalSports: 0,
  totalAthletesOrRegistrations: 0,
};

export const useHomeStore = create<HomeState>((set) => ({
  tournaments: [],
  upcomingMatches: [],
  sports: [],
  stats: emptyStats,
  loading: false,
  error: null,

  fetchHomeData: async () => {
    set({ loading: true, error: null });
    try {
      const data = await homeService.getHomeData();
      set({
        tournaments: data.tournaments,
        upcomingMatches: data.matches,
        sports: data.sports,
        stats: data.stats,
      });
    } catch (error) {
      set({
        error: getApiErrorMessage(error, "Không thể tải dữ liệu trang chủ. Vui lòng thử lại."),
      });
    } finally {
      set({ loading: false });
    }
  },
}));
