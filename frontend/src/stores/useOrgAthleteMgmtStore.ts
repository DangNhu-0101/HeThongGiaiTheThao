import { create } from "zustand";
import type { OrgAthleteRecord } from "@/types/orgAthleteMgmt";
import { orgAthleteMgmtService } from "@/services/orgAthleteMgmtService";

export interface OrgAthleteMgmtState {
  records: OrgAthleteRecord[];
  loading: boolean;
  fetchData: () => Promise<void>;
  toggleStatus: (athleteId: string, newStatus: OrgAthleteRecord['status']) => void;
}

export const useOrgAthleteMgmtStore = create<OrgAthleteMgmtState>((set) => ({
  records: [],
  loading: false,

  fetchData: async () => {
    set({ loading: true });
    try {
      const data = await orgAthleteMgmtService.getAthleteData();
      set({ records: data });
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu VĐV:", error);
    } finally {
      set({ loading: false });
    }
  },

  toggleStatus: (athleteId, newStatus) => set((state) => ({
    records: state.records.map(athlete => 
      athlete.id === athleteId ? { ...athlete, status: newStatus } : athlete
    )
  }))
}));