import api from "@/libs/axios";

export interface AccountSearchResult {
  id: string;
  username: string;
  email: string;
  phoneNumber?: string;
  avatar?: string;
  roles: string[];
}

const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : Array.isArray((value as { data?: unknown[] })?.data) ? (value as { data: unknown[] }).data : [];

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? value as Record<string, unknown> : {};

export const accountLinkService = {
  async searchAccounts(keyword: string, role?: "player" | "referee"): Promise<AccountSearchResult[]> {
    const term = keyword.trim();
    if (term.length < 2) return [];
    const response = await api.get("/users/search", { params: { name: term, role } });
    return asArray(response.data).map((item) => {
      const raw = asRecord(item);
      return {
        id: String(raw._id || raw.id || ""),
        username: String(raw.username || ""),
        email: String(raw.email || ""),
        phoneNumber: raw.phoneNumber ? String(raw.phoneNumber) : undefined,
        avatar: raw.avatar ? String(raw.avatar) : undefined,
        roles: Array.isArray(raw.roles) ? raw.roles.map(String) : [],
      };
    }).filter((item) => item.id);
  },

  async linkReferee(refereeId: string, userId: string) {
    const response = await api.patch(`/tournament-referees/${refereeId}/link-account`, { userId });
    return response.data;
  },

  async linkPlayer(playerId: string, userId: string, tournamentItemId?: string) {
    const response = await api.patch(`/participants/players/${playerId}/link-account`, { userId, tournamentItemId });
    return response.data;
  },
};
