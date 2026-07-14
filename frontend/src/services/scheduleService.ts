import api from "@/libs/axios";
import type { ScheduleMatch } from "@/types/schedule";
import { asArray, asRecord } from "@/services/orgMatchPlanningService";
import { readMatchSourceLabels } from "@/utils/matchSourceLabels";

type ApiList<T = unknown> = T[] | { data?: T[]; success?: boolean };

const toDate = (value: unknown) => {
  const date = value ? new Date(String(value)) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toTime = (value: unknown) => {
  const date = value ? new Date(String(value)) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

const mapStatus = (value: unknown): ScheduleMatch["status"] => {
  if (value === "live") return "live";
  if (value === "completed" || value === "walkover" || value === "forfeited") return "completed";
  return "scheduled";
};

const getObjectId = (value: unknown) => {
  const record = asRecord(value);
  return String(record._id || record.id || (typeof value === "string" ? value : ""));
};

const getResultScores = (result: Record<string, unknown>, teamAId: string, teamBId: string) => {
  const details = asRecord(result.details);
  const winnerId = getObjectId(result.winnerParticipantId);
  const teamAScore = Number(details.teamA ?? (winnerId && winnerId === teamAId ? result.winnerScore : result.loserScore) ?? 0);
  const teamBScore = Number(details.teamB ?? (winnerId && winnerId === teamBId ? result.winnerScore : result.loserScore) ?? 0);
  return { teamAScore, teamBScore };
};

const readSetScores = (details: Record<string, unknown>) => {
  const rawSets = Array.isArray(details.sets) ? details.sets : Array.isArray(details.games) ? details.games : [];
  return rawSets.map((item) => {
    const set = asRecord(item);
    if (set.teamA !== undefined || set.teamB !== undefined) return `${set.teamA ?? 0} - ${set.teamB ?? 0}`;
    return String(item);
  });
};

export const scheduleService = {
  async getSchedule(tournamentId: string): Promise<ScheduleMatch[]> {
    const response = await api.get<ApiList>(`/matches/public/tournament-item/${tournamentId}`);
    return asArray(response.data).map((item, index) => {
      const raw = asRecord(item);
      const { teamA, teamB, nameA, nameB } = readMatchSourceLabels(raw);
      const court = asRecord(raw.courtId);
      const stage = asRecord(raw.stageId);
      const result = asRecord(raw.matchResultId);
      const details = asRecord(result.details);
      const statistics = asRecord(result.statistics);
      const teamAId = getObjectId(teamA);
      const teamBId = getObjectId(teamB);
      const { teamAScore, teamBScore } = getResultScores(result, teamAId, teamBId);
      const status = mapStatus(raw.status);
      const winnerId = getObjectId(raw.winnerParticipantId || result.winnerParticipantId);
      const winner = asRecord(raw.winnerParticipantId || result.winnerParticipantId);

      return {
        id: String(raw._id || index + 1),
        date: toDate(raw.scheduledTime),
        time: toTime(raw.scheduledTime),
        venue: String(court.name || raw.venue || "Sân thi đấu"),
        teamA: { id: teamAId, name: nameA || "Chưa xác định", logoUrl: String(teamA.logo || "") },
        teamB: { id: teamBId, name: nameB || "Chưa xác định", logoUrl: String(teamB.logo || "") },
        status,
        score: status === "completed" ? `${teamAScore} - ${teamBScore}` : undefined,
        roundInfo: String(stage.name || raw.roundName || raw.name || "Vòng đấu"),
        courtId: getObjectId(raw.courtId),
        refereeIds: Array.isArray(raw.refereeIds) ? raw.refereeIds.map(getObjectId).filter(Boolean) : [],
        startTime: raw.scheduledTime ? String(raw.scheduledTime) : "",
        winnerId,
        winnerName: winner.name ? String(winner.name) : winnerId === teamAId ? nameA : winnerId === teamBId ? nameB : "",
        isDraw: Boolean(result.isDraw),
        resultStatus: String(result.status || ""),
        setScores: readSetScores(details),
        note: String(details.note || details.notes || statistics.note || statistics.notes || ""),
      } satisfies ScheduleMatch;
    });
  },
};
