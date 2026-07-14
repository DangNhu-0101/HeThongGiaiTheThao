import api from "@/libs/axios";
import type { OrgAthleteRecord } from "@/types/orgAthleteMgmt";
import type { Participant } from "@/types/participant";
import { accountLinkService } from "./accountLinkService";

const genderLabel = (gender?: string): OrgAthleteRecord["gender"] =>
  gender === "female" ? "Nữ" : "Nam";

const initialsFrom = (value?: string, fallback = "?") => {
  const text = value?.trim();
  if (!text) return fallback;
  const words = text.split(/\s+/).filter(Boolean);
  const initials = words.length > 1 ? `${words[0][0]}${words[words.length - 1][0]}` : text.slice(0, 2);
  return initials.toUpperCase();
};

const calcAge = (birthDate?: string) => {
  if (!birthDate) return 0;
  const date = new Date(birthDate);
  if (Number.isNaN(date.getTime())) return 0;
  return new Date().getFullYear() - date.getFullYear();
};

const playerLevel = (player?: Participant["lineup"][number]["Player"]) => {
  if (!player || typeof player === "string") return "Chưa cập nhật";
  const sports = Array.isArray(player.sports) ? player.sports[0] : player.sports;
  return sports?.level || (player.skill ? String(player.skill) : "Chưa cập nhật");
};

export const orgAthleteMgmtService = {
  async getAthleteData(tournamentItemId?: string): Promise<OrgAthleteRecord[]> {
    if (!tournamentItemId) return [];
    try {
      const response = await api.get<{ data: Participant[] }>(`/participants/tournament/${tournamentItemId}`);
      return response.data.data.flatMap((participant) =>
        participant.lineup.map((lineup, index) => {
          const player = typeof lineup.Player === "string" ? undefined : lineup.Player;
          const user = player?.userId && typeof player.userId === "object"
            ? player.userId as { _id?: string; username?: string; email?: string }
            : undefined;
          const name = player?.name || player?.username || `${participant.name} #${index + 1}`;
          return {
            id: typeof lineup.Player === "string" ? lineup.Player : player?._id || `${participant._id}-${index}`,
            name,
            avatar: initialsFrom(name, `${index + 1}`),
            teamName: participant.name,
            teamLogo: initialsFrom(participant.name, "T"),
            gender: genderLabel(player?.gender),
            age: calcAge(player?.birthDate),
            rating: playerLevel(player),
            contact: "",
            status: player?.status === "injured" || player?.status === "unavailable" ? "Suspended" : "Active",
            registeredAt: participant.createdAt ? new Date(participant.createdAt).toLocaleDateString("vi-VN") : "",
            accountLinked: Boolean(user?._id || (player?.userId && typeof player.userId === "string")),
            accountLabel: user ? String(user.username || user.email || "") : "",
          } satisfies OrgAthleteRecord;
        }),
      );
    } catch (error) {
      console.error("Không thể tải danh sách VĐV từ backend.", error);
      return [];
    }
  },

  async linkPlayerAccount(playerId: string, userId: string, tournamentItemId?: string) {
    return accountLinkService.linkPlayer(playerId, userId, tournamentItemId);
  },
};

