import { mockResultStats, mockResultMatches } from "@/data/mockOrgResultMgmt";
import type { ResultStat, ResultMatchRecord } from "@/types/orgResultMgmt";

export const orgResultMgmtService = {
  async getResultData(): Promise<{ stats: ResultStat[], matches: ResultMatchRecord[] }> {
    return new Promise((resolve) => setTimeout(() => resolve({ stats: mockResultStats, matches: mockResultMatches }), 500));
  }
};