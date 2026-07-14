import { create } from "zustand";
import type { ResourceStat, OrgVenueRecord, OrgRefereeRecord } from "@/types/orgResourceMgmt";
import { orgResourceMgmtService } from "@/services/orgResourceMgmtService";

export interface OrgResourceMgmtState {
  venueStats: ResourceStat[];
  refereeStats: ResourceStat[];
  venues: OrgVenueRecord[];
  referees: OrgRefereeRecord[];
  tournamentItemId: string;
  loading: boolean;
  fetchData: (tournamentItemId?: string) => Promise<void>;
  addVenue: (venue: Pick<OrgVenueRecord, "name" | "location">) => Promise<void>;
  updateVenue: (id: string, venue: Partial<OrgVenueRecord>) => Promise<void>;
  deleteVenue: (id: string) => Promise<void>;
  addReferee: (referee: Pick<OrgRefereeRecord, "name" | "qualification" | "experience" | "status"> & { phoneNumber?: string }) => Promise<void>;
  updateReferee: (id: string, referee: Partial<OrgRefereeRecord> & { phoneNumber?: string }) => Promise<void>;
  deleteReferee: (id: string) => Promise<void>;
  linkRefereeAccount: (id: string, userId: string) => Promise<void>;
}

export const useOrgResourceMgmtStore = create<OrgResourceMgmtState>((set, get) => ({
  venueStats: [], refereeStats: [], venues: [], referees: [], tournamentItemId: "", loading: false,

  fetchData: async (tournamentItemId) => {
    set({ loading: true });
    try {
      const data = await orgResourceMgmtService.getResourceData(tournamentItemId);
      set({ 
        venueStats: data.venueStats, refereeStats: data.refereeStats, 
        venues: data.venues, referees: data.referees,
        tournamentItemId: tournamentItemId || ""
      });
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu tài nguyên:", error);
    } finally {
      set({ loading: false });
    }
  },

  addVenue: async (venue) => {
    const tournamentItemId = get().tournamentItemId;
    if (!tournamentItemId) throw new Error("Vui lòng chọn giải trước khi thêm sân.");
    await orgResourceMgmtService.createVenue(tournamentItemId, venue);
    await get().fetchData(tournamentItemId);
  },

  updateVenue: async (id, venue) => {
    await orgResourceMgmtService.updateVenue(id, venue);
    await get().fetchData(get().tournamentItemId);
  },

  deleteVenue: async (id) => {
    await orgResourceMgmtService.deleteVenue(id);
    await get().fetchData(get().tournamentItemId);
  },

  addReferee: async (referee) => {
    const tournamentItemId = get().tournamentItemId;
    if (!tournamentItemId) throw new Error("Vui lòng chọn giải trước khi thêm trọng tài.");
    await orgResourceMgmtService.createReferee(tournamentItemId, referee);
    await get().fetchData(tournamentItemId);
  },

  updateReferee: async (id, referee) => {
    await orgResourceMgmtService.updateReferee(id, referee);
    await get().fetchData(get().tournamentItemId);
  },

  deleteReferee: async (id) => {
    await orgResourceMgmtService.deleteReferee(id);
    await get().fetchData(get().tournamentItemId);
  },

  linkRefereeAccount: async (id, userId) => {
    await orgResourceMgmtService.linkRefereeAccount(id, userId);
    await get().fetchData(get().tournamentItemId);
  }
}));
