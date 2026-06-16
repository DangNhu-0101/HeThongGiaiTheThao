import { mockFormatPopularity, mockSportStats, mockSports, mockUsageDistribution } from "@/data/mockAdminSportsConfig";
import type { ChartData, SportRecord, SportStat } from "@/types/adminSportsConfig";
import { getBackendSportsConfig } from "./backendAdapters";

export const adminSportsConfigService = {
  async getConfigData(): Promise<{ stats: SportStat[]; sports: SportRecord[]; usage: ChartData[]; formats: ChartData[] }> {
    try {
      return await getBackendSportsConfig();
    } catch (error) {
      console.warn("Cannot fetch sports config from backend, using demo data.", error);
      return {
        stats: mockSportStats,
        sports: mockSports,
        usage: mockUsageDistribution,
        formats: mockFormatPopularity,
      };
    }
  },
};
