import { mockSports, mockTournaments } from "@/data/mockHomeData";
import type { Sport, Tournament } from "@/types/tournament";
import { buildSportsFromTournaments, getBackendTournaments } from "./backendAdapters";

export const tournamentService = {
  async getAllTournaments(filters?: Record<string, unknown>): Promise<{ tournaments: Tournament[]; sports: Sport[] }> {
    try {
      const tournaments = await getBackendTournaments(filters);
      return {
        tournaments,
        sports: buildSportsFromTournaments(tournaments),
      };
    } catch (error) {
      console.warn("Cannot fetch tournaments from backend, using demo data.", error);
      return {
        tournaments: mockTournaments,
        sports: mockSports,
      };
    }
  },
};
