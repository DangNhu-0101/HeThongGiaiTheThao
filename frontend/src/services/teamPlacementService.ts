import api from "@/libs/axios";

export type TeamPlacementStrategy = "SNAKE_BALANCE" | "STRONG_VS_WEAK" | "CLOSE_SKILL" | "SEEDED_BRACKET";

export interface TeamPlacementPreviewItem {
  teamId: string;
  teamName: string;
  skillScore: number;
  seed: number;
  groupId?: string | null;
  groupName?: string;
  matchId?: string | null;
  slotId: string;
}

export interface TeamPlacementPreviewResponse {
  placements?: TeamPlacementPreviewItem[];
  stage?: unknown;
  warnings?: string[];
  summary?: { placedTeams?: number; totalTeams?: number };
}

export const teamPlacementService = {
  async preview(tournamentItemId: string, stageId: string, strategy: TeamPlacementStrategy, stageDraft?: unknown) {
    const response = await api.post<{ success: boolean; data?: TeamPlacementPreviewResponse }>(
      `/tournaments/${tournamentItemId}/team-placement/preview`,
      {
        stageId,
        strategy,
        ...(stageDraft === undefined ? {} : { stageDraft }),
      },
    );
    return response.data.data || {};
  },

  async confirm(tournamentItemId: string, stageId: string, strategy: TeamPlacementStrategy) {
    const response = await api.post<{ success: boolean; data?: unknown }>(`/tournaments/${tournamentItemId}/team-placement/confirm`, {
      stageId,
      strategy,
    });
    return response.data.data;
  },
};
