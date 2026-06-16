import { create } from "zustand";
import  type { ScheduleMatch } from "@/types/schedule";
import { scheduleService } from "@/services/scheduleService";

export interface ScheduleState {
  matches: ScheduleMatch[];
  loading: boolean;
  fetchSchedule: (tournamentId: string) => Promise<void>;
}

export const useScheduleStore = create<ScheduleState>((set) => ({
  matches: [],
  loading: false,

  fetchSchedule: async (tournamentId) => {
    set({ loading: true });
    try {
      const data = await scheduleService.getSchedule(tournamentId);
      set({ matches: data });
    } catch (error) {
      console.error("Lỗi khi tải lịch thi đấu", error);
    } finally {
      set({ loading: false });
    }
  }
}));