import { mockMatches, mockSports, mockTournaments } from "@/data/mockHomeData";
import type { HomeDataResponse } from "@/types/api";
import { buildSportsFromTournaments, getBackendTournaments } from "./backendAdapters";

export const homeService = {
  async getHomeData(): Promise<HomeDataResponse> {
    try {
      const tournaments = await getBackendTournaments({ limit: 6 });
      return {
        tournaments,
        matches: mockMatches,
        sports: buildSportsFromTournaments(tournaments),
      };
    } catch (error) {
      console.warn("Cannot fetch home data from backend, using demo data.", error);
      return {
        tournaments: mockTournaments,
        matches: mockMatches,
        sports: mockSports,
      };
    }
  },
};
