import api from "@/libs/axios";
import type { AdminStat, AdminOrgRecord, ChartData } from "@/types/adminDashboard";

type DashboardResponse = {
  success?: boolean;
  data?: {
    stats?: AdminStat[];
    orgs?: AdminOrgRecord[];
    revenueData?: ChartData[];
    pieData?: { name: string; value: number; color: string }[];
    totals?: Record<string, number>;
  };
};

export const adminDashboardService = {
  async getDashboardData(): Promise<{
    stats: AdminStat[];
    orgs: AdminOrgRecord[];
    revenueData: ChartData[];
    pieData: { name: string; value: number; color: string }[];
    totals: Record<string, number>;
  }> {
    const response = await api.get<DashboardResponse>("/admin/dashboard");
    const data = response.data.data || {};
    return {
      stats: data.stats || [],
      orgs: data.orgs || [],
      revenueData: data.revenueData || [],
      pieData: data.pieData || [],
      totals: data.totals || {},
    };
  },
};
