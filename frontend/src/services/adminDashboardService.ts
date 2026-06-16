import { mockAdminStats, mockOrgRecords, mockRevenueData } from "@/data/mockAdminDashboard";
import type { AdminStat, AdminOrgRecord, ChartData } from "@/types/adminDashboard";

export const adminDashboardService = {
  // Hàm này mai mốt bạn chỉ cần thay bằng axios.get('/api/v1/admin/dashboard') là xong!
  async getDashboardData(): Promise<{ stats: AdminStat[], orgs: AdminOrgRecord[], revenueData: ChartData[] }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          stats: mockAdminStats,
          orgs: mockOrgRecords,
          revenueData: mockRevenueData
        });
      }, 500); // Giả lập độ trễ mạng 0.5s
    });
  }
};