import api from "@/libs/axios";
import { teamPlacementService } from "@/services/teamPlacementService";
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
  const data = await teamPlacementService.preview(
    tournamentItemId,
    String(stageRecord.id || ""),
    criterion === "skill" ? "CLOSE_SKILL" : "SEEDED_BRACKET",
    stage,
  );
  const placements = data.placements || [];
  const resolvedStage = asRecord(data.stage);
  const resolvedStageId = String(resolvedStage.id || stageRecord.id || "");
  return {
    assignments: placements.map((placement) => ({
      slotId: placement.slotId,
      participantId: placement.teamId,
      participantName: placement.teamName,
      sourceType: "PARTICIPANT",
      stageId: resolvedStageId,
      groupName: placement.groupName || "",
      groupId: placement.groupId || "",
      nodeId: placement.matchId || "",
      slotLabel: placement.groupName || placement.matchId || "",
    })),
    notes: data.warnings || [],
    assignedTeams: data.summary?.placedTeams || placements.length,
    totalTeams: data.summary?.totalTeams || placements.length,
  };
};

export const confirmAutoSeed = async (
  tournamentItemId: string,
  stageId: string,
  criterion: AutoSeedCriterion,
) => {
  return teamPlacementService.confirm(tournamentItemId, stageId, criterion === "skill" ? "CLOSE_SKILL" : "SEEDED_BRACKET");
};
