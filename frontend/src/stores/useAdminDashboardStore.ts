import { create } from "zustand";
import type { AdminStat, AdminOrgRecord, ChartData } from "@/types/adminDashboard";
import { adminDashboardService } from "@/services/adminDashboardService";

export interface AdminDashboardState {
  stats: AdminStat[];
  orgs: AdminOrgRecord[];
  revenueData: ChartData[];
  loading: boolean;
  fetchData: () => Promise<void>;
}

export const useAdminDashboardStore = create<AdminDashboardState>((set) => ({
  stats: [],
  orgs: [],
  revenueData: [],
  loading: false,

  fetchData: async () => {
    set({ loading: true });
    try {
      // Gọi qua Service thay vì nhét cứng mock data ở đây
      const data = await adminDashboardService.getDashboardData();
      set({ 
        stats: data.stats, 
        orgs: data.orgs, 
        revenueData: data.revenueData 
      });
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu Admin Dashboard:", error);
    } finally {
      set({ loading: false });
    }
  }
}));