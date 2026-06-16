import { mockMgmtStats, mockTournamentRecords } from "@/data/mockOrgTournamentMgmt";
import type { TournamentMgmtStat, TournamentRecord } from "@/types/orgTournamentMgmt";
import { getBackendOrgTournaments, mapTournamentMgmt } from "./backendAdapters";

export const orgTournamentMgmtService = {
  async getMgmtData(): Promise<{ stats: TournamentMgmtStat[]; records: TournamentRecord[] }> {
    try {
      const tournaments = await getBackendOrgTournaments();
      return mapTournamentMgmt(tournaments);
    } catch (error) {
      console.warn("Cannot fetch organization tournaments from backend, using demo data.", error);
      return { stats: mockMgmtStats, records: mockTournamentRecords };
    }
  },
};
