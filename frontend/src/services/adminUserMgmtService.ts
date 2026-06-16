import { mockUserStats, mockUserRecords } from "@/data/mockAdminUserMgmt";
import type { UserStatItem, AdminUserRecord } from "@/types/adminUserMgmt";

export const adminUserMgmtService = {
  async getUserMgmtData(): Promise<{ stats: UserStatItem[], records: AdminUserRecord[] }> {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ stats: mockUserStats, records: mockUserRecords }), 400);
    });
  }
};