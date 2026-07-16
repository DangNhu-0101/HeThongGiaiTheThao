import api from "@/libs/axios";
import type { Participant } from "@/types/participant";

type ApiList<T = unknown> = T[] | { data?: T[]; success?: boolean };

export interface PlanningTeam {
  id: string;
  name: string;
  logo: string;
  skill?: number;
  seed?: number;
  ranking?: number;
}

export interface PlanningPair {
  teamA: PlanningTeam;
  teamB: PlanningTeam;
}

export type AutoSeedCriterion = "skill" | "seed";

export const asArray = <T>(payload: ApiList<T>): T[] =>
  Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];

export const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? value as Record<string, unknown> : {};

export const initials = (value: unknown, fallback = "?") => {
  const text = String(value || "").trim();
  if (!text) return fallback;
  const parts = text.split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : text.slice(0, 2)).toUpperCase();
};

export const isGeneratedMatchId = (id: string) => id.startsWith("generated-");

export const fetchPlanningTeams = async (tournamentItemId: string): Promise<PlanningTeam[]> => {
  const response = await api.get<ApiList<Participant>>(`/participants/tournament/${tournamentItemId}`);
  return asArray(response.data)
    .filter((participant) => {
      if (participant.type !== "team") return false;
      if (participant.registrationStatus === "rejected" || participant.registrationStatus === "suspended") return false;
      return true;
    })
    .map((participant) => {
      const record = participant as Participant & { skill?: number; seed?: number; ranking?: number };
      return {
        id: participant._id,
        name: participant.name || "Đội chưa đặt tên",
        logo: participant.logo || initials(participant.name),
        skill: Number(record.skill || 0),
        seed: Number(record.seed || 0),
        ranking: Number(record.ranking || 0),
      };
    });
};

export const pairPlanningTeams = (teams: PlanningTeam[]): PlanningPair[] => {
  const pairs: PlanningPair[] = [];
  for (let index = 0; index < teams.length; index += 2) {
    pairs.push({
      teamA: teams[index],
      teamB: teams[index + 1] || { id: "", name: "Chờ đội / BYE", logo: "-" },
    });
  }
  return pairs;
};

export const previewAutoSeed = async <TStage>(
  tournamentItemId: string,
  stage: TStage,
  criterion: AutoSeedCriterion,
) => {
  const stageRecord = asRecord(stage);
  const response = await api.post<{
    success: boolean;
    data?: {
      placements?: Array<{
        teamId: string;
        teamName: string;
        skillScore: number;
        seed: number;
        groupId?: string | null;
        groupName?: string;
        matchId?: string | null;
        slotId: string;
      }>;
      warnings?: string[];
      summary?: { placedTeams?: number; totalTeams?: number };
    };
  }>(
    `/tournaments/${tournamentItemId}/team-placement/preview`,
    {
      stageId: String(stageRecord.id || ""),
      strategy: criterion === "skill" ? "CLOSE_SKILL" : "SEEDED_BRACKET",
    },
  );
  const placements = response.data.data?.placements || [];
  return {
    assignments: placements.map((placement) => ({
      slotId: placement.slotId,
      participantId: placement.teamId,
      participantName: placement.teamName,
      sourceType: "PARTICIPANT",
      stageId: String(stageRecord.id || ""),
      groupName: placement.groupName || "",
      groupId: placement.groupId || "",
      nodeId: placement.matchId || "",
      slotLabel: placement.groupName || placement.matchId || "",
    })),
    notes: response.data.data?.warnings || [],
    assignedTeams: response.data.data?.summary?.placedTeams || placements.length,
    totalTeams: response.data.data?.summary?.totalTeams || placements.length,
  };
};

export const confirmAutoSeed = async (
  tournamentItemId: string,
  stageId: string,
  criterion: AutoSeedCriterion,
) => {
  const response = await api.post(`/tournaments/${tournamentItemId}/team-placement/confirm`, {
    stageId,
    strategy: criterion === "skill" ? "CLOSE_SKILL" : "SEEDED_BRACKET",
  });
  return response.data.data;
};
