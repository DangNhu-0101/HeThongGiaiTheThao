import type { OrgRefereeRecord, OrgVenueRecord, ResourceStat } from "@/types/orgResourceMgmt";
import api from "@/libs/axios";
import { getBackendResources } from "./backendAdapters";
import { accountLinkService } from "./accountLinkService";

const toBackendCourtStatus = (status?: OrgVenueRecord["status"]) => {
  if (status === "Booked") return "busy";
  if (status === "Maintenance") return "maintenance";
  if (status === "Closed") return "inactived";
  return "empty";
};

const toBackendRefereeStatus = (status?: OrgRefereeRecord["status"]) => {
  if (status === "Assigned") return "assigned";
  if (status === "Unavailable") return "unavailable";
  return "available";
};

export const orgResourceMgmtService = {
  async getResourceData(tournamentItemId?: string): Promise<{
    venueStats: ResourceStat[];
    refereeStats: ResourceStat[];
    venues: OrgVenueRecord[];
    referees: OrgRefereeRecord[];
  }> {
    try {
      if (!tournamentItemId) {
        return { venueStats: [], refereeStats: [], venues: [], referees: [] };
      }
      return await getBackendResources(tournamentItemId);
    } catch (error) {
      console.error("Không thể tải thông tin sân và nhân sự từ BE.", error);
      return { venueStats: [], refereeStats: [], venues: [], referees: [] };
    }
  },

  async createVenue(tournamentItemId: string, venue: Pick<OrgVenueRecord, "name" | "location">) {
    const response = await api.post("/courts", {
      tournamentItemId,
      name: venue.name,
      location: venue.location,
    });
    return response.data;
  },

  async updateVenue(id: string, venue: Partial<OrgVenueRecord>) {
    const response = await api.put(`/courts/${id}`, {
      name: venue.name,
      location: venue.location,
    });
    if (venue.status) {
      await api.patch(`/courts/${id}/status`, { status: toBackendCourtStatus(venue.status) });
    }
    return response.data;
  },

  async deleteVenue(id: string) {
    const response = await api.delete(`/courts/${id}`);
    return response.data;
  },

  async createReferee(
    tournamentItemId: string,
    referee: Pick<OrgRefereeRecord, "name" | "qualification" | "experience" | "status"> & { phoneNumber?: string },
  ) {
    const response = await api.post("/tournament-referees", {
      tournamentItemId,
      name: referee.name,
      phoneNumber: referee.phoneNumber || "",
      qualification: referee.qualification,
      experience: referee.experience,
      status: toBackendRefereeStatus(referee.status),
    });
    return response.data;
  },

  async updateReferee(id: string, referee: Partial<OrgRefereeRecord> & { phoneNumber?: string }) {
    const response = await api.put(`/tournament-referees/${id}`, {
      name: referee.name,
      phoneNumber: referee.phoneNumber,
      qualification: referee.qualification,
      experience: referee.experience,
      status: referee.status ? toBackendRefereeStatus(referee.status) : undefined,
    });
    return response.data;
  },

  async deleteReferee(id: string) {
    const response = await api.delete(`/tournament-referees/${id}`);
    return response.data;
  },

  async linkRefereeAccount(id: string, userId: string) {
    return accountLinkService.linkReferee(id, userId);
  },
};
