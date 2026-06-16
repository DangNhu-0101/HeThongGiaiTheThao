import { mockAthleteRecords } from "@/data/mockOrgAthleteMgmt";
import type { OrgAthleteRecord } from "@/types/orgAthleteMgmt";

export const orgAthleteMgmtService = {
  async getAthleteData(): Promise<OrgAthleteRecord[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockAthleteRecords), 500);
    });
  }
};