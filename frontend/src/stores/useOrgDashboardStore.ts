import { create } from "zustand";
import  type { OrgDashboardData } from "@/types/orgDashboard";
import { orgDashboardService } from "@/services/orgDashboardService";

export interface OrgDashboardState {
  data: OrgDashboardData | null;
  loading: boolean;
  fetchDashboard: () => Promise<void>;
}

export const useOrgDashboardStore = create<OrgDashboardState>((set) => ({
  data: null,
  loading: false,

  fetchDashboard: async () => {
    set({ loading: true });
    try {
      const response = await orgDashboardService.getDashboardData();
      set({ data: response });
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu dashboard:", error);
    } finally {
      set({ loading: false });
    }
  }
}));