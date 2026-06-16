import { create } from "zustand";
import type { TeamDetailInfo, TeamMember, Achievement } from "@/types/Team";
import  type { Tournament } from "@/types/tournament";
import { teamService } from "@/services/teamService";

export interface TeamState {
  info: TeamDetailInfo | null;
  members: TeamMember[];
  achievements: Achievement[];
  tournaments: Tournament[];
  loading: boolean;
  fetchTeamDetail: (teamId: string) => Promise<void>;
}

export const useTeamStore = create<TeamState>((set) => ({
  info: null,
  members: [],
  achievements: [],
  tournaments: [],
  loading: false,

  fetchTeamDetail: async (teamId) => {
    set({ loading: true });
    try {
      const data = await teamService.getTeamDetail(teamId);
      set({
        info: data.info,
        members: data.members,
        achievements: data.achievements,
        tournaments: data.tournaments
      });
    } catch (error) {
      console.error("Lỗi khi tải thông tin đội", error);
    } finally {
      set({ loading: false });
    }
  }
}));