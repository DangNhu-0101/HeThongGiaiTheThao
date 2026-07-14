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
      console.error("Không thể tai danh sach giải đấu", error);
      return {
        tournaments: [],
        sports: [],
      };
    }
  },
};
