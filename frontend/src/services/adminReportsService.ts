import { mockReportStats, mockTrendData, mockDistributionData, mockExportFiles } from "@/data/mockAdminReports";
import type { ReportStatItem, TrendDataPoint, DistributionDataPoint, ExportFileItem } from "@/types/adminReports";

export const adminReportsService = {
  async getReportsData(): Promise<{ stats: ReportStatItem[], trend: TrendDataPoint[], distribution: DistributionDataPoint[], exports: ExportFileItem[] }> {
    return new Promise((resolve) => {
      setTimeout(() => resolve({
        stats: mockReportStats, trend: mockTrendData, distribution: mockDistributionData, exports: mockExportFiles
      }), 400);
    });
  }
};