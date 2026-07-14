import { create } from "zustand";
import { scheduleService } from "@/services/scheduleService";
import type { ScheduleMatch } from "@/types/schedule";

export interface ScheduleState {
  matches: ScheduleMatch[];
  loading: boolean;
  error: string | null;
  fetchSchedule: (tournamentId: string) => Promise<void>;
}

export const useScheduleStore = create<ScheduleState>((set) => ({
  matches: [],
  loading: false,
  error: null,

  fetchSchedule: async (tournamentId) => {
    set({ loading: true, error: null });
    try {
      const data = await scheduleService.getSchedule(tournamentId);
      set({ matches: data, error: null });
    } catch (error) {
      console.error("Không thể tai lịch thi đấu", error);
      set({ matches: [], error: "Không thể tai lịch thi đấu. Vui lòng thử lại sau." });
    } finally {
      set({ loading: false });
    }
  },
}));
