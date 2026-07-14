import api from "@/libs/axios";

export interface ProfileTeamRecord {
  id: string;
  name: string;
  tournamentName: string;
  sport: string;
  status: string;
  members: number;
  createdAt?: string;
}

type ApiList<T = unknown> = T[] | { data?: T[] };
const asArray = <T>(payload: ApiList<T>) => Array.isArray(payload) ? payload : Array.isArray(payload.data) ? payload.data : [];
const asRecord = (value: unknown): Record<string, unknown> => value && typeof value === "object" ? value as Record<string, unknown> : {};

export const profileService = {
  async getMyTeams(): Promise<ProfileTeamRecord[]> {
    const response = await api.get<ApiList>("/participants/my");
    return asArray(response.data).map((item) => {
      const raw = asRecord(item);
      const tournament = asRecord(raw.tournamentItemId);
      const categoryRule = asRecord(tournament.categoryRule);
      return {
        id: String(raw._id || raw.id || ""),
        name: String(raw.name || "Đội thi đấu"),
        tournamentName: String(tournament.name || "Giải đấu"),
        sport: String(tournament.sportType || categoryRule.sportType || "Chưa cập nhật"),
        status: String(raw.registrationStatus || raw.status || "pending"),
        members: Array.isArray(raw.lineup) ? raw.lineup.length : 0,
        createdAt: String(raw.createdAt || ""),
      };
    });
  },
};
