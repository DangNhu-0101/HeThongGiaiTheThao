import { mockGroupStandings, mockTopScorers, mockTopAssists } from "@/data/mockStandingsData";
import type { GroupStanding, TopPerformer } from "@/types/standing";

export const standingsService = {
  async getStandingsData(_tournamentId: string): Promise<{ groups: GroupStanding[], topScorers: TopPerformer[], topAssists: TopPerformer[] }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ 
          groups: mockGroupStandings, 
          topScorers: mockTopScorers, 
          topAssists: mockTopAssists 
        });
      }, 500);
    });
  }
};