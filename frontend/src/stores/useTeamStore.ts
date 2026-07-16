import { create } from "zustand";
import { toast } from "sonner";
import type { Achievement, TeamDetailInfo, TeamMember } from "@/types/Team";
import type { Tournament } from "@/types/tournament";
import { teamService } from "@/services/teamService";

export interface TeamState {
  info: TeamDetailInfo | null;
  members: TeamMember[];
  achievements: Achievement[];
  tournaments: Tournament[];
  loading: boolean;
  fetchTeamDetail: (teamId: string) => Promise<void>;
  removeMember: (teamId: string, memberId: string) => Promise<void>;
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
      set({ ...data });
    } catch (error) {
      console.error("Không thể tải chi tiết đội:", error);
      set({ info: null, members: [], achievements: [], tournaments: [] });
    } finally {
      set({ loading: false });
    }
  },
  removeMember: async (teamId, memberId) => {
    await teamService.removeMember(teamId, memberId);
    const data = await teamService.getTeamDetail(teamId);
    set({ ...data });
    toast.success("Đã xóa thành viên khỏi đội.");
  },
}));
