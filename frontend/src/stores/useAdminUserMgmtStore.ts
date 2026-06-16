import { create } from "zustand";
import type { UserStatItem, AdminUserRecord } from "@/types/adminUserMgmt";
import { adminUserMgmtService } from "@/services/adminUserMgmtService";

export interface AdminUserMgmtState {
  stats: UserStatItem[];
  records: AdminUserRecord[];
  loading: boolean;
  fetchData: () => Promise<void>;
  updateUserStatus: (id: string, status: AdminUserRecord['status']) => void;
}

export const useAdminUserMgmtStore = create<AdminUserMgmtState>((set) => ({
  stats: [], records: [], loading: false,
  fetchData: async () => {
    set({ loading: true });
    try {
      const data = await adminUserMgmtService.getUserMgmtData();
      set({ stats: data.stats, records: data.records });
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu người dùng:", error);
    } finally {
      set({ loading: false });
    }
  },
  updateUserStatus: (id, status) => set((state) => ({
    records: state.records.map(r => r.id === id ? { ...r, status } : r)
  }))
}));