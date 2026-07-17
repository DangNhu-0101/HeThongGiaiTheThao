import api from "@/libs/axios";
import type { MatchStatusTag, ResultMatchRecord, ResultStageOption, ResultStat } from "@/types/orgResultMgmt";
import { asArray, asRecord, isGeneratedMatchId } from "@/services/orgMatchPlanningService";
import { initialsFromSource, readMatchSourceLabels } from "@/utils/matchSourceLabels";

type ApiList<T = unknown> = T[] | { data?: T[]; success?: boolean };

const formatTime = (value: unknown) => {
  const date = value ? new Date(String(value)) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
};

const formatDate = (value: unknown) => {
  const date = value ? new Date(String(value)) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const statusLabel = (status: string, tags: MatchStatusTag[]) =>
  tags.find((tag) => tag.value === status)?.label || status || "Chưa diễn ra";

const buildMatchRoundLabel = (raw: Record<string, unknown>) => {
  const stage = asRecord(raw.stageId);
  const group = asRecord(raw.groupId);
  const bracket = asRecord(raw.bracketId);
  const stageName = String(stage.name || "").trim();
  const bracketName = String(bracket.name || "").trim();
  const bracketType = String(bracket.type || "").toLowerCase();
  const groupName = String(group.name || "").trim();
  const roundNumber = Number(raw.round || 0);

  if (groupName || bracketType === "group") {
    return [groupName, roundNumber > 0 ? `Lượt ${roundNumber}` : stageName || bracketName].filter(Boolean).join(" - ");
  }

  return stageName || bracketName || String(raw.name || "Knockout");
};

const readPairFromMatch = (raw: Record<string, unknown>) => {
  const { teamA, teamB, nameA, nameB } = readMatchSourceLabels(raw);
  const finalNameA = nameA || "Chưa xác định";
  const finalNameB = nameB || "Chưa xác định";
  return {
    teamA: {
      id: String(teamA._id || teamA.id || ""),
      name: finalNameA,
      logo: String(teamA.logo || initialsFromSource(finalNameA) || "?"),
    },
    teamB: {
      id: String(teamB._id || teamB.id || ""),
      name: finalNameB,
      logo: String(teamB.logo || initialsFromSource(finalNameB) || "?"),
    },
  };
};

const statsFromMatches = (matches: ResultMatchRecord[]): ResultStat[] => [
  { id: "total", label: "Tổng trận", value: matches.length, iconType: "total", color: "text-blue-600 bg-blue-100" },
  { id: "live", label: "Đang diễn ra", value: matches.filter((item) => item.status === "live").length, iconType: "live", color: "text-red-600 bg-red-100" },
  { id: "completed", label: "Đã xong", value: matches.filter((item) => ["completed", "walkover", "forfeited"].includes(item.status)).length, iconType: "completed", color: "text-green-600 bg-green-100" },
  { id: "pending", label: "Chờ nhập", value: matches.filter((item) => item.status === "pending").length, iconType: "pending", color: "text-amber-600 bg-amber-100" },
  { id: "synced", label: "Đồng bộ", value: matches.filter((item) => !isGeneratedMatchId(item.id)).length, iconType: "synced", color: "text-purple-600 bg-purple-100" },
];

export const orgResultMgmtService = {
  async getResultData(tournamentItemId?: string): Promise<{
    stats: ResultStat[];
    matches: ResultMatchRecord[];
    stages: ResultStageOption[];
    statusTags: MatchStatusTag[];
  }> {
    if (!tournamentItemId) return { stats: [], matches: [], stages: [], statusTags: [] };

    try {
      const [stagesResponse, statusResponse, matchesResponse] = await Promise.all([
        api.get<ApiList>("/stages/tournament-item/" + tournamentItemId),
        api.get<{ data?: MatchStatusTag[] }>("/matches/status-tags"),
        api.get<ApiList>("/matches/tournament-item/" + tournamentItemId),
      ]);

      const tags = asArray(statusResponse.data);
      const stages = asArray(stagesResponse.data).map((stage) => {
        const raw = asRecord(stage);
        return {
          id: String(raw._id || raw.id || ""),
          name: String(raw.name || "Stage"),
          order: Number(raw.number || raw.order || 0),
          standingsStatus: raw.standingsStatus === "published" ? "published" : "draft",
        } satisfies ResultStageOption;
      });

      const rawMatches = asArray(matchesResponse.data).map(asRecord);
      const matches = rawMatches.map((raw, index) => {
        const stage = asRecord(raw.stageId);
        const group = asRecord(raw.groupId);
        const court = asRecord(raw.courtId);
        const result = asRecord(raw.matchResultId);
        const resultDetails = asRecord(result.details);
        const status = String(raw.status || "pending");
        const pair = readPairFromMatch(raw);
        return {
          id: String(raw._id || raw.id || ""),
          tournamentName: "",
          round: buildMatchRoundLabel(raw),
          stageId: String(stage._id || raw.stageId || ""),
          groupName: group.name ? String(group.name) : "",
          courtId: String(court._id || ""),
          date: formatDate(raw.scheduledTime),
          tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
          matchCode: String(raw.name || `M${index + 1}`),
          time: formatTime(raw.scheduledTime),
          venue: String(court.name || ""),
          referee: "",
          teamA: { ...pair.teamA, score: Number(resultDetails.teamA || 0) },
          teamB: { ...pair.teamB, score: Number(resultDetails.teamB || 0) },
          status,
          statusLabel: statusLabel(status, tags),
        } satisfies ResultMatchRecord;
      });

      return {
        stats: statsFromMatches(matches),
        matches,
        stages,
        statusTags: tags,
      };
    } catch (error) {
      console.error("Không thể tải kết quả thi đấu từ BE.", error);
      throw error;
    }
  },

  async confirmMatchResult(match: ResultMatchRecord) {
    if (isGeneratedMatchId(match.id)) {
      throw new Error("Trận này chưa được đồng bộ lên backend.");
    }
    const winner = match.teamA.score >= match.teamB.score ? match.teamA : match.teamB;
    const loser = winner.id === match.teamA.id ? match.teamB : match.teamA;
    if (!winner.id) return;
    return api.post(`/matches/${match.id}/complete`, {
      winnerParticipantId: winner.id,
      participantScores: {
        winner: winner.score,
        loser: loser.score,
        details: {
          teamA: match.teamA.score,
          teamB: match.teamB.score,
        },
      },
    });
  },

  async saveLiveScore(match: ResultMatchRecord) {
    if (isGeneratedMatchId(match.id)) {
      throw new Error("Trận này chưa được đồng bộ lên backend.");
    }
    return api.patch(`/matches/${match.id}/live-score`, {
      participantScores: {
        details: {
          teamA: match.teamA.score,
          teamB: match.teamB.score,
        },
        teamA: match.teamA.score,
        teamB: match.teamB.score,
      },
    });
  },

  async updateMatchStatus(matchId: string, status: string) {
    if (isGeneratedMatchId(matchId)) return;
    await api.put(`/matches/${matchId}`, { status });
  },

  async publishStageStandings(stageId: string) {
    await api.patch(`/stages/${stageId}/standings/publish`);
  },
};
