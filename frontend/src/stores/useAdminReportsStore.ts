import { create } from "zustand";
import type { ReportStatItem, TrendDataPoint, DistributionDataPoint, ExportFileItem } from "@/types/adminReports";
import { adminReportsService } from "@/services/adminReportsService";

export interface AdminReportsState {
  stats: ReportStatItem[];
  trendData: TrendDataPoint[];
  distributionData: DistributionDataPoint[];
  exportFiles: ExportFileItem[];
  loading: boolean;
  fetchData: () => Promise<void>;
}

export const useAdminReportsStore = create<AdminReportsState>((set) => ({
  stats: [], trendData: [], distributionData: [], exportFiles: [], loading: false,
  fetchData: async () => {
    set({ loading: true });
    try {
      const data = await adminReportsService.getReportsData();
      set({ stats: data.stats, trendData: data.trend, distributionData: data.distribution, exportFiles: data.exports });
    } catch (e) {
      console.error(e);
    } finally {
      set({ loading: false });
    }
  }
}));