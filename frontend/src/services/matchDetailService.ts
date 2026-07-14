import api from "@/libs/axios";
import type { MatchDetailData, MatchTeam, TeamForm } from "@/types/matchDetail";
import { initialsFromSource, readMatchSourceLabels } from "@/utils/matchSourceLabels";

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? value as Record<string, unknown> : {};

const readData = (payload: unknown) => asRecord(asRecord(payload).data || payload);

const toStatus = (status: unknown): MatchDetailData["status"] => {
  const value = String(status || "").toLowerCase();
  if (value === "completed" || value === "walkover" || value === "forfeited") return "completed";
  if (value === "live" || value === "in_progress") return "live";
  return "scheduled";
};

const shortForm = (isWinner: boolean | null): TeamForm[] => {
  if (isWinner === null) return [];
  return [{ result: isWinner ? "W" : "L", color: isWinner ? "bg-green-500 text-white" : "bg-red-500 text-white" }];
};

const mapTeam = (
  rawTeam: Record<string, unknown>,
  fallbackName: string,
  score: number,
  isWinner: boolean | null,
): MatchTeam => {
  const name = String(rawTeam.name || fallbackName || "Chưa xác định");
  return {
    id: String(rawTeam._id || rawTeam.id || fallbackName),
    name,
    logo: initialsFromSource(name),
    country: String(rawTeam.organization || rawTeam.location || ""),
    group: "",
    form: shortForm(isWinner),
    score,
  };
};

export const matchDetailService = {
  async getMatchDetail(matchId: string): Promise<MatchDetailData> {
    const response = await api.get(`/matches/${matchId}`);
    const match = readData(response.data);
    const result = asRecord(match.matchResultId);
    const details = asRecord(result.details);
    const { teamA, teamB, nameA, nameB } = readMatchSourceLabels(match);
    const scoreA = Number(details.teamA ?? 0);
    const scoreB = Number(details.teamB ?? 0);
    const winnerId = String(asRecord(match.winnerParticipantId)._id || match.winnerParticipantId || "");
    const teamAId = String(teamA._id || teamA.id || "");
    const teamBId = String(teamB._id || teamB.id || "");
    const hasWinner = Boolean(winnerId);
    const scheduledTime = match.scheduledTime ? new Date(String(match.scheduledTime)) : null;
    const status = toStatus(match.status);

    return {
      id: String(match._id || matchId),
      tournamentName: String(asRecord(match.tournamentItemId).name || "Giải đấu"),
      status,
      liveMinute: status === "live" ? "LIVE" : status === "completed" ? "FT" : "SAP DAU",
      teamA: mapTeam(teamA, nameA, scoreA, hasWinner && teamAId ? winnerId === teamAId : null),
      teamB: mapTeam(teamB, nameB, scoreB, hasWinner && teamBId ? winnerId === teamBId : null),
      info: {
        venue: String(asRecord(match.courtId).name || "Chưa có san"),
        date: scheduledTime ? scheduledTime.toLocaleDateString("vi-VN") : "Chưa xếp lịch",
        time: scheduledTime ? scheduledTime.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "",
        round: String(asRecord(match.stageId).name || match.name || "Trận đấu"),
        sport: "Pickleball",
      },
      events: [],
      keyPlayers: [],
    };
  },
};
