import { create } from "zustand";
import type { TournamentMgmtStat, TournamentRecord } from "@/types/orgTournamentMgmt";
import { orgTournamentMgmtService } from "@/services/orgTournamentMgmtService";

export interface OrgTournamentMgmtState {
  stats: TournamentMgmtStat[];
  records: TournamentRecord[];
  loading: boolean;
  fetchData: () => Promise<void>;
}

export const useOrgTournamentMgmtStore = create<OrgTournamentMgmtState>((set) => ({
  stats: [],
  records: [],
  loading: false,

  fetchData: async () => {
    set({ loading: true });
    try {
      const data = await orgTournamentMgmtService.getMgmtData();
      set({ stats: data.stats, records: data.records });
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu quản lý giải đấu:", error);
    } finally {
      set({ loading: false });
    }
  }
}));