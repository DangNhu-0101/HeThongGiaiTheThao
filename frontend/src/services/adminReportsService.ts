import api from "@/libs/axios";
import type { ReportStatItem, TrendDataPoint, DistributionDataPoint, ExportFileItem } from "@/types/adminReports";

type ReportsResponse = {
  data?: {
    stats?: ReportStatItem[];
    trend?: TrendDataPoint[];
    distribution?: DistributionDataPoint[];
    exports?: ExportFileItem[];
  };
};

export const adminReportsService = {
  async getReportsData(): Promise<{
    stats: ReportStatItem[];
    trend: TrendDataPoint[];
    distribution: DistributionDataPoint[];
    exports: ExportFileItem[];
  }> {
    const response = await api.get<ReportsResponse>("/admin/reports");
    const data = response.data.data || {};
    return {
      stats: data.stats || [],
      trend: data.trend || [],
      distribution: data.distribution || [],
      exports: data.exports || [],
    };
  },
};
