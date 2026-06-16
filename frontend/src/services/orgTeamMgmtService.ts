import { mockTeamStats, mockTeamRecords } from "@/data/mockOrgTeamMgmt";
import type { TeamMgmtStat, OrgTeamRecord } from "@/types/orgTeamMgmt";

export const orgTeamMgmtService = {
  async getTeamData(): Promise<{ stats: TeamMgmtStat[], records: OrgTeamRecord[] }> {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ stats: mockTeamStats, records: mockTeamRecords }), 500);
    });
  }
};