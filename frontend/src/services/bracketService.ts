import api from "@/libs/axios";
import type { BracketTeam, BracketTreeNode, TieBreakRule } from "@/types/bracketTree";
import { initialsFromSource, readMatchSourceLabels } from "@/utils/matchSourceLabels";

type ApiList<T = unknown> = T[] | { data?: T[] };

const asArray = <T>(payload: ApiList<T>): T[] => {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload?.data) ? payload.data : [];
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? value as Record<string, unknown> : {};

const readPayloadData = (payload: unknown) => asRecord(asRecord(payload).data || payload);

const statusOf = (status: unknown): BracketTreeNode["status"] => {
  const value = String(status || "").toLowerCase();
  if (value === "completed" || value === "walkover" || value === "forfeited") return "completed";
  if (value === "live" || value === "in_progress") return "live";
  return "upcoming";
};

const mapTeam = (rawTeam: Record<string, unknown>, fallbackName: string, score: number, winnerId: string): BracketTeam | null => {
  const name = String(rawTeam.name || fallbackName || "").trim();
  if (!name) return null;
  const id = String(rawTeam._id || rawTeam.id || fallbackName);
  return {
    id,
    name,
    logo: initialsFromSource(name),
    score,
    isWinner: Boolean(winnerId && id === winnerId),
  };
};

const buildNode = (match: Record<string, unknown>, byId: Map<string, Record<string, unknown>>, seen = new Set<string>()): BracketTreeNode => {
  const id = String(match._id || match.id || match.name || "");
  seen.add(id);
  const result = asRecord(match.matchResultId);
  const details = asRecord(result.details);
  const { teamA, teamB, nameA, nameB } = readMatchSourceLabels(match);
  const winnerId = String(asRecord(match.winnerParticipantId)._id || match.winnerParticipantId || "");
  const scheduledTime = match.scheduledTime ? new Date(String(match.scheduledTime)) : null;
  const previousMatches = Array.isArray(match.previousMatches) ? match.previousMatches : [];
  const sourceIds = previousMatches
    .map((item) => String(asRecord(asRecord(item).matchId)._id || asRecord(item).matchId || ""))
    .filter((sourceId) => sourceId && !seen.has(sourceId));

  return {
    id,
    round: String(asRecord(match.stageId).name || match.name || "Stage"),
    teamA: mapTeam(teamA, nameA, Number(details.teamA ?? 0), winnerId),
    teamB: mapTeam(teamB, nameB, Number(details.teamB ?? 0), winnerId),
    status: statusOf(match.status),
    time: scheduledTime ? scheduledTime.toLocaleString("vi-VN") : "",
    info: String(match.name || ""),
    children: sourceIds.map((sourceId) => buildNode(byId.get(sourceId) || { _id: sourceId, name: "Chưa cập nhật" }, byId, new Set(seen))),
  };
};

export const bracketService = {
  async getBracketTreeData(tournamentId: string): Promise<{ rootNode: BracketTreeNode | null; rules: TieBreakRule[] }> {
    const response = await api.get(`/matches/knockout/${tournamentId}`);
    const data = readPayloadData(response.data);
    const matches = asArray<Record<string, unknown>>(data.matches as ApiList<Record<string, unknown>>);
    if (matches.length === 0) {
      return { rootNode: null, rules: [] };
    }

    const byId = new Map(matches.map((match) => [String(match._id || match.id || ""), match]));
    const referenced = new Set<string>();
    matches.forEach((match) => {
      (Array.isArray(match.previousMatches) ? match.previousMatches : []).forEach((item) => {
        const sourceId = String(asRecord(asRecord(item).matchId)._id || asRecord(item).matchId || "");
        if (sourceId) referenced.add(sourceId);
      });
    });

    const roots = matches.filter((match) => !referenced.has(String(match._id || match.id || "")));
    const rootMatch = roots.sort((a, b) => Number(asRecord(b.stageId).number || b.round || 0) - Number(asRecord(a.stageId).number || a.round || 0))[0] || matches[0];
    return {
      rootNode: buildNode(rootMatch, byId),
      rules: [],
    };
  },
};
