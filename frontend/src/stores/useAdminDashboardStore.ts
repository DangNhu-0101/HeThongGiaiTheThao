import { create } from "zustand";
import type { AdminStat, AdminOrgRecord, ChartData } from "@/types/adminDashboard";
import { adminDashboardService } from "@/services/adminDashboardService";

export interface AdminDashboardState {
  stats: AdminStat[];
  orgs: AdminOrgRecord[];
  revenueData: ChartData[];
  pieData: { name: string; value: number; color: string }[];
  loading: boolean;
  error: string | null;
  fetchData: () => Promise<void>;
}

export const useAdminDashboardStore = create<AdminDashboardState>((set) => ({
  stats: [],
  orgs: [],
  revenueData: [],
  pieData: [],
  loading: false,
  error: null,

  fetchData: async () => {
    set({ loading: true, error: null });
    try {
      const data = await adminDashboardService.getDashboardData();
      set({
        stats: data.stats,
        orgs: data.orgs,
        revenueData: data.revenueData,
        pieData: data.pieData,
        error: null,
      });
    } catch (error) {
      console.error("Admin dashboard load failed", error);
      set({ error: "Không thể tai dữ liệu dashboard admin." });
    } finally {
      set({ loading: false });
    }
  },
}));
