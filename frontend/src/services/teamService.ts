import api from "@/libs/axios";
import type { Achievement, TeamDetailInfo, TeamMember } from "@/types/Team";
import type { Participant, ParticipantApiResponse, ParticipantTournamentItemRef } from "@/types/participant";
import type { Tournament } from "@/types/tournament";

const API_ORIGIN = (import.meta.env.VITE_API_URL
  || (import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "/api"))
  .replace(/\/api\/?$/, "");

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? value as Record<string, unknown> : {};

const normalizeImage = (value?: unknown) => {
  const image = String(value || "").trim();
  if (!image) return "";
  if (/^(https?:\/\/|data:image\/|blob:)/i.test(image)) return image;
  if (/^\/?uploads\//i.test(image)) return `${API_ORIGIN}/${image.replace(/^\/+/, "")}`;
  return image;
};

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

const genderLabel = (value?: string) => {
  if (value === "male") return "Nam";
  if (value === "female") return "Nữ";
  if (value === "other") return "Khác";
  return "Chưa cập nhật";
};

const mapStatus = (value?: string): TeamDetailInfo["status"] =>
  value === "suspended" || value === "rejected" ? "Tạm ngưng" : "Đang hoạt động";

export const teamService = {
  async getTeamDetail(teamIdOrSlug: string): Promise<{
    info: TeamDetailInfo;
    members: TeamMember[];
    achievements: Achievement[];
    tournaments: Tournament[];
  }> {
    const response = await api.get<ParticipantApiResponse & { data: Participant & { publicMeta?: Record<string, unknown>; achievements?: unknown[] } }>(`/participants/public/${teamIdOrSlug}`);
    const participant = response.data.data;
    const rawParticipant = participant as Participant & {
      description?: string;
      paymentQR?: string;
      feeAmount?: number;
      publicMeta?: Record<string, unknown>;
      representative?: { name?: string; phone?: string; email?: string };
      achievements?: unknown[];
    };
    const tournamentItemId = getTournamentItemId(participant.tournamentItemId);
    const tournamentItem = (typeof participant.tournamentItemId === "object" && participant.tournamentItemId
      ? participant.tournamentItemId
      : {}) as Partial<ParticipantTournamentItemRef> & {
      description?: string;
      banner?: string;
      logo?: string;
      feeEntry?: number;
      maxTeams?: number;
      paymentQR?: string;
      status?: string;
      paymentConfig?: { paymentQR?: string; feePerAthlete?: number };
      timeLine?: { tournamentStart?: string; tournamentEnd?: string };
      location?: { city?: string; district?: string; detail?: string } | string;
    };
    const meta = rawParticipant.publicMeta || {};

    const members = participant.lineup.map((item, index) => {
      const player = playerRecord(item.Player);
      const sport = Array.isArray(player.sports) ? asRecord(player.sports[0]) : asRecord(player.sports);
      return {
        id: player._id,
        userId: getUserId(player.userId),
        name: player.name || player.username || `Thành viên ${index + 1}`,
        role: index === 0 ? "Đội trưởng" : "Thành viên",
        avatar: normalizeImage(player.avatar) || player.name?.slice(0, 1) || "",
        gender: genderLabel(player.gender),
        birthDate: player.birthDate ? String(player.birthDate) : "",
        skill: Number(player.skill || 0),
        position: String(sport.position || ""),
        jerseyNumber: String((player as { jerseyNumber?: string }).jerseyNumber || ""),
        stats: { matches: 0, wins: 0, rating: player.skill ? `${player.skill}/5` : "Chưa có" },
        country: "Việt Nam",
      } satisfies TeamMember;
    });
    const captain = members[0];
    const location = typeof tournamentItem.location === "string"
      ? tournamentItem.location
      : tournamentItem.location?.detail || tournamentItem.location?.district || tournamentItem.location?.city || "";
    const achievements = (rawParticipant.achievements || []).map((value) => {
      const raw = asRecord(value);
      return {
        id: String(raw._id || raw.id || `${raw.title}-${raw.achievedAt}`),
        year: Number(raw.season || (raw.achievedAt ? new Date(String(raw.achievedAt)).getFullYear() : new Date().getFullYear())),
        title: String(raw.title || "Danh hiệu"),
        tournamentName: String(raw.tournamentName || tournamentItem.name || ""),
        sport: String(raw.sportType || tournamentItem.sportType || ""),
        achievedAt: raw.achievedAt ? String(raw.achievedAt) : undefined,
        badgeImage: normalizeImage(raw.badgeImage),
        description: String(raw.title || "Danh hiệu đội đạt được từ kết quả đã xác nhận."),
        type: (raw.type || "other") as Achievement["type"],
      };
    });

    return {
      info: {
        id: participant._id,
        slug: (participant as Participant & { slug?: string }).slug,
        tournamentItemId,
        name: participant.name,
        logo: normalizeImage(participant.logo) || participant.name.slice(0, 2).toUpperCase(),
        banner: normalizeImage(tournamentItem.banner),
        description: rawParticipant.description || tournamentItem.description || "",
        sport: tournamentItem.sportType || "Chưa xác định",
        tournamentName: tournamentItem.name || "",
        tournamentStatus: tournamentItem.status || "",
        status: mapStatus(participant.registrationStatus),
        division: participant.type === "team" ? "Đội thi" : "Cá nhân",
        location,
        founded: participant.createdAt ? new Date(participant.createdAt).getFullYear() : new Date().getFullYear(),
        coach: rawParticipant.representative?.name || "",
        captainName: captain?.name || rawParticipant.representative?.name || "",
        currentMembers: Number(meta.currentMembers || members.length),
        maxMembers: Number(meta.maxMembers || 0),
        isFull: Boolean(meta.isFull),
        registrationOpen: Boolean(meta.registrationOpen),
        canRequestJoin: Boolean(meta.canRequestJoin),
        publicContact: {
          name: rawParticipant.representative?.name || "",
          phone: rawParticipant.representative?.phone || "",
          email: rawParticipant.representative?.email || "",
        },
        paymentQR: normalizeImage(rawParticipant.paymentQR || tournamentItem.paymentQR || tournamentItem.paymentConfig?.paymentQR),
        feeAmount: rawParticipant.feeAmount || tournamentItem.feeEntry || tournamentItem.paymentConfig?.feePerAthlete || 0,
        overallStats: { players: members.length, wins: 0, titles: achievements.length },
      },
      members,
      achievements,
      tournaments: [],
    };
  },

  async removeMember(teamId: string, memberId: string): Promise<void> {
    await api.delete(`/participants/${teamId}/members/${memberId}`);
  },
};
