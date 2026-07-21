import api from "@/libs/axios";
import type {
  CreateParticipantPayload,
  Participant,
  ParticipantApiResponse,
  TeamTournamentOption,
} from "@/types/participant";

type ApiList = { data?: unknown[] } | unknown[];

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? value as Record<string, unknown> : {};

const asArray = (value: ApiList): unknown[] =>
  Array.isArray(value) ? value : Array.isArray(value.data) ? value.data : [];

const mapTournamentItem = (value: unknown, parentTournamentName?: string): TeamTournamentOption => {
  const item = asRecord(value);
  const categoryRule = asRecord(item.categoryRule);
  const timeLine = asRecord(item.timeLine);
  return {
    id: String(item._id || item.id || ""),
    name: String(item.name || categoryRule.name || "Giải đấu"),
    sportType: String(item.sportType || categoryRule.sportType || "Chưa xác định"),
    registrationEnd: timeLine.registrationEnd ? String(timeLine.registrationEnd) : undefined,
    parentTournamentName,
  };
};

export const participantService = {
  async create(payload: CreateParticipantPayload): Promise<Participant> {
    const response = await api.post<ParticipantApiResponse>("/participants", payload);
    return response.data.data;
  },

  async getByTournament(tournamentItemId: string): Promise<Participant[]> {
    const response = await api.get<{ success: boolean; data: Participant[] }>(
      `/participants/tournament/${tournamentItemId}`,
    );
    return response.data.data;
  },

  async getPublicByTournament(tournamentItemId: string): Promise<Participant[]> {
    const response = await api.get<{ success: boolean; data: Participant[] }>(
      `/participants/public/tournament/${tournamentItemId}`,
    );
    return response.data.data;
  },

  async getMyParticipants(): Promise<Participant[]> {
    const response = await api.get<{ success: boolean; data: Participant[] }>("/participants/my");
    return response.data.data;
  },

  async getTournamentOptions(): Promise<TeamTournamentOption[]> {
    const response = await api.get<ApiList>("/tournaments/open-registration");
    return asArray(response.data)
      .map((item) => {
        const record = asRecord(item);
        const parent = asRecord(record.tournamentId);
        return mapTournamentItem(record, parent.name ? String(parent.name) : undefined);
      })
      .filter((item) => item.id);
  },
};
