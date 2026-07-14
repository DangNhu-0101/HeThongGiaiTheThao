import api from "@/libs/axios";
import type { Participant } from "@/types/participant";

type ApiList<T = unknown> = T[] | { data?: T[]; success?: boolean };

export interface PlanningTeam {
  id: string;
  name: string;
  logo: string;
}

export interface PlanningPair {
  teamA: PlanningTeam;
  teamB: PlanningTeam;
}

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
    .map((participant) => ({
      id: participant._id,
      name: participant.name || "Đội chưa đặt tên",
      logo: participant.logo || initials(participant.name),
    }));
};

export const pairPlanningTeams = (teams: PlanningTeam[]): PlanningPair[] => {
  const pairs: PlanningPair[] = [];
  for (let index = 0; index < teams.length; index += 2) {
    pairs.push({
      teamA: teams[index],
      teamB: teams[index + 1] || { id: "", name: "Cho doi / BYE", logo: "-" },
    });
  }
  return pairs;
};
