import { mockOrgDashboardData } from "@/data/mockOrgDashboard";
import type { OrgDashboardData } from "@/types/orgDashboard";

export const orgDashboardService = {
  async getDashboardData(): Promise<OrgDashboardData> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockOrgDashboardData);
      }, 500);
    });
  }
};