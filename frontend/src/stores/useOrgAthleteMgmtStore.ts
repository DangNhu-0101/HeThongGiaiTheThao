import { create } from "zustand";
import type { OrgAthleteRecord } from "@/types/orgAthleteMgmt";
import { orgAthleteMgmtService } from "@/services/orgAthleteMgmtService";

export interface OrgAthleteMgmtState {
  records: OrgAthleteRecord[];
  loading: boolean;
  tournamentItemId: string;
  fetchData: (tournamentItemId?: string) => Promise<void>;
  toggleStatus: (athleteId: string, newStatus: OrgAthleteRecord["status"]) => void;
  linkPlayerAccount: (playerId: string, userId: string) => Promise<void>;
}

export const useOrgAthleteMgmtStore = create<OrgAthleteMgmtState>((set, get) => ({
  records: [],
  loading: false,
  tournamentItemId: "",

  fetchData: async (tournamentItemId) => {
    set({ loading: true });
    try {
      const data = await orgAthleteMgmtService.getAthleteData(tournamentItemId);
      set({ records: data, tournamentItemId: tournamentItemId || "" });
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu VĐV:", error);
    } finally {
      set({ loading: false });
    }
  },

  toggleStatus: (athleteId, newStatus) => set((state) => ({
    records: state.records.map((athlete) =>
      athlete.id === athleteId ? { ...athlete, status: newStatus } : athlete,
    ),
  })),

  linkPlayerAccount: async (playerId, userId) => {
    const tournamentItemId = get().tournamentItemId;
    await orgAthleteMgmtService.linkPlayerAccount(playerId, userId, tournamentItemId);
    await get().fetchData(tournamentItemId);
  },
}));
