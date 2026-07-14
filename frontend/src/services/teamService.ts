import api from "@/libs/axios";
import type { Achievement, TeamDetailInfo, TeamMember } from "@/types/Team";
import type { Participant, ParticipantApiResponse, ParticipantTournamentItemRef } from "@/types/participant";
import type { Tournament } from "@/types/tournament";

const playerRecord = (value: Participant["lineup"][number]["Player"]) =>
  typeof value === "string" ? { _id: value } : value;

const getTournamentItemId = (value: Participant["tournamentItemId"]) =>
  typeof value === "string" ? value : value?._id || "";

const getUserId = (value: unknown) => {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "object" && "_id" in value) return String((value as { _id?: string })._id || "");
  return undefined;
};

export const teamService = {
  async getTeamDetail(teamId: string): Promise<{
    info: TeamDetailInfo;
    members: TeamMember[];
    achievements: Achievement[];
    tournaments: Tournament[];
  }> {
    const response = await api.get<ParticipantApiResponse>(`/participants/${teamId}`);
    const participant = response.data.data;
    const rawParticipant = participant as Participant & { paymentQR?: string; feeAmount?: number };
    const tournamentItemId = getTournamentItemId(participant.tournamentItemId);
    let tournamentItem: Partial<ParticipantTournamentItemRef> & {
      paymentConfig?: { paymentQR?: string; feePerAthlete?: number };
    } = typeof participant.tournamentItemId === "object" && participant.tournamentItemId
      ? participant.tournamentItemId
      : {};

    if (tournamentItemId && typeof participant.tournamentItemId === "string") {
      try {
        const tournamentResponse = await api.get(`/tournaments/single/${tournamentItemId}`);
        tournamentItem = tournamentResponse.data;
      } catch {
        tournamentItem = {};
      }
    }

    const members = participant.lineup.map((item, index) => {
      const player = playerRecord(item.Player);
      return {
        id: player._id,
        userId: getUserId(player.userId),
        name: player.name || player.username || `Thành viên ${index + 1}`,
        role: index === 0 ? "Đội trưởng" : "Thành viên",
        avatar: player.avatar || player.name?.slice(0, 1) || "",
        stats: { matches: 0, wins: 0, rating: player.skill ? `${player.skill}` : "Chưa có" },
        country: "Việt Nam",
      } satisfies TeamMember;
    });

    return {
      info: {
        id: participant._id,
        tournamentItemId,
        name: participant.name,
        logo: participant.logo || "",
        sport: tournamentItem.sportType || "Chưa xác định",
        status: "Đang hoạt động",
        division: participant.type === "team" ? "Đội thi" : "Cá nhân",
        location: "",
        founded: participant.createdAt ? new Date(participant.createdAt).getFullYear() : new Date().getFullYear(),
        coach: "",
        paymentQR: rawParticipant.paymentQR || tournamentItem.paymentQR || tournamentItem.paymentConfig?.paymentQR || "",
        feeAmount: rawParticipant.feeAmount || tournamentItem.feeEntry || tournamentItem.paymentConfig?.feePerAthlete || 0,
        overallStats: { players: members.length, wins: 0, titles: 0, ranking: 0 },
      },
      members,
      achievements: [],
      tournaments: [],
    };
  },

  async removeMember(teamId: string, memberId: string): Promise<void> {
    await api.delete(`/participants/${teamId}/members/${memberId}`);
  },
};
