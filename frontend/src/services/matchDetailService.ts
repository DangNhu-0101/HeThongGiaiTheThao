import { mockMatchDetail } from "@/data/mockMatchDetailData";
import type { MatchDetailData } from "@/types/matchDetail";

export const matchDetailService = {
  async getMatchDetail(_matchId: string): Promise<MatchDetailData> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockMatchDetail);
      }, 500);
    });
  }
};