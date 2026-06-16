import { create } from "zustand";
import type { ResourceStat, OrgVenueRecord, OrgRefereeRecord } from "@/types/orgResourceMgmt";
import { orgResourceMgmtService } from "@/services/orgResourceMgmtService";

export interface OrgResourceMgmtState {
  venueStats: ResourceStat[];
  refereeStats: ResourceStat[];
  venues: OrgVenueRecord[];
  referees: OrgRefereeRecord[];
  loading: boolean;
  fetchData: () => Promise<void>;
}

export const useOrgResourceMgmtStore = create<OrgResourceMgmtState>((set) => ({
  venueStats: [], refereeStats: [], venues: [], referees: [], loading: false,

  fetchData: async () => {
    set({ loading: true });
    try {
      const data = await orgResourceMgmtService.getResourceData();
      set({ 
        venueStats: data.venueStats, refereeStats: data.refereeStats, 
        venues: data.venues, referees: data.referees 
      });
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu tài nguyên:", error);
    } finally {
      set({ loading: false });
    }
  }
}));