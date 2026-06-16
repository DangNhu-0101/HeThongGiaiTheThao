import { mockScheduleMatches } from "@/data/mockScheduleData";
import type { ScheduleMatch } from "@/types/schedule";

export const scheduleService = {
  async getSchedule(_tournamentId: string): Promise<ScheduleMatch[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockScheduleMatches);
      }, 500);
    });
  }
};