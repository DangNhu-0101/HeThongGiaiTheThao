import { mockRefereeRecords, mockRefereeStats, mockVenueRecords, mockVenueStats } from "@/data/mockOrgResourceMgmt";
import type { OrgRefereeRecord, OrgVenueRecord, ResourceStat } from "@/types/orgResourceMgmt";
import { getBackendResources } from "./backendAdapters";

export const orgResourceMgmtService = {
  async getResourceData(): Promise<{
    venueStats: ResourceStat[];
    refereeStats: ResourceStat[];
    venues: OrgVenueRecord[];
    referees: OrgRefereeRecord[];
  }> {
    try {
      return await getBackendResources();
    } catch (error) {
      console.warn("Cannot fetch courts/resources from backend, using demo data.", error);
      return {
        venueStats: mockVenueStats,
        refereeStats: mockRefereeStats,
        venues: mockVenueRecords,
        referees: mockRefereeRecords,
      };
    }
  },
};
