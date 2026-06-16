import { mockTeamInfo, mockTeamMembers, mockAchievements, mockTeamTournaments } from "@/data/mockTeamData";
import  type { TeamDetailInfo, TeamMember, Achievement } from "@/types/Team";
import type { Tournament } from "@/types/tournament";

export const teamService = {
  async getTeamDetail(_teamId: string): Promise<{
    info: TeamDetailInfo;
    members: TeamMember[];
    achievements: Achievement[];
    tournaments: Tournament[];
  }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          info: mockTeamInfo,
          members: mockTeamMembers,
          achievements: mockAchievements,
          tournaments: mockTeamTournaments
        });
      }, 500);
    });
  }
};