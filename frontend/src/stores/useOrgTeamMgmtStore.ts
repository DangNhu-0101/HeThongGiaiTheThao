import { create } from "zustand";
import type { TeamMgmtStat, OrgTeamRecord } from "@/types/orgTeamMgmt";
import { orgTeamMgmtService } from "@/services/orgTeamMgmtService";

export interface OrgTeamMgmtState {
  stats: TeamMgmtStat[];
  records: OrgTeamRecord[];
  loading: boolean;
  fetchData: () => Promise<void>;
  toggleFeeExempt: (teamId: string) => void;
}

export const useOrgTeamMgmtStore = create<OrgTeamMgmtState>((set) => ({
  stats: [],
  records: [],
  loading: false,

  fetchData: async () => {
    set({ loading: true });
    try {
      const data = await orgTeamMgmtService.getTeamData();
      set({ stats: data.stats, records: data.records });
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu đội:", error);
    } finally {
      set({ loading: false });
    }
  },

  // Hàm xử lý khi bấm "Được miễn phí" từ nút 3 chấm
  toggleFeeExempt: (teamId) => set((state) => ({
    records: state.records.map(team => 
      team.id === teamId ? { ...team, isFree: !team.isFree } : team
    )
  }))
}));