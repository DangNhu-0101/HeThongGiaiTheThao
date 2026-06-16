import { mockScheduleStats, mockCapacity, mockVenues, mockScheduleMatches } from "@/data/mockOrgScheduleMgmt";
import type { ScheduleStat, CapacityData, VenueColumn, ScheduleMatchRecord } from "@/types/orgScheduleMgmt";

export const orgScheduleMgmtService = {
  async getScheduleData(): Promise<{ stats: ScheduleStat[], capacity: CapacityData, venues: VenueColumn[], matches: ScheduleMatchRecord[] }> {
    return new Promise((resolve) => setTimeout(() => resolve({
      stats: mockScheduleStats, capacity: mockCapacity, venues: mockVenues, matches: mockScheduleMatches
    }), 500));
  }
};