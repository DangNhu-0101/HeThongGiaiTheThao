import api from "@/libs/axios";
import type { MatchStatusTag, ResultMatchRecord, ResultStageOption, ResultStat } from "@/types/orgResultMgmt";
import {
  asArray,
  asRecord,
  fetchPlanningTeams,
  initials,
  isGeneratedMatchId,
  pairPlanningTeams,
  type PlanningPair,
} from "@/services/orgMatchPlanningService";
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

const matchCodeOf = (raw: Record<string, unknown>) => String(raw.name || "").trim().toUpperCase();

const stageOrderOf = (raw: Record<string, unknown>) => {
  const stage = asRecord(raw.stageId);
  return Number(stage.number || raw.round || 0);
};

const winnerParticipantFromMatch = (raw: Record<string, unknown>) => {
  const winner = asRecord(raw.winnerParticipantId);
  if (winner.name) return winner;
  const participants = Array.isArray(raw.participants) ? raw.participants.map(asRecord) : [];
  const result = asRecord(raw.matchResultId);
  const details = asRecord(result.details);
  const teamA = Number(details.teamA || 0);
  const teamB = Number(details.teamB || 0);
  if (String(raw.status || "") !== "completed" || teamA === teamB) return {};
  return participants[teamA > teamB ? 0 : 1] || {};
};

const resolveDependencyParticipants = (raw: Record<string, unknown>, allMatches: Record<string, unknown>[]) => {
  const labels = Array.isArray(raw.formatSlotLabels) ? raw.formatSlotLabels.map(String) : [];
  if (!labels.some((label) => /^M\d+$/i.test(label.trim()))) return raw;

  const participants = Array.isArray(raw.participants) ? raw.participants.map(asRecord) : [];
  const targetStageOrder = stageOrderOf(raw);
  labels.forEach((label, index) => {
    if (participants[index]?.name || !/^M\d+$/i.test(label.trim())) return;
    const source = allMatches
      .filter((candidate) => matchCodeOf(candidate) === label.trim().toUpperCase() && stageOrderOf(candidate) < targetStageOrder)
      .sort((a, b) => stageOrderOf(b) - stageOrderOf(a))[0];
    const winner = source ? winnerParticipantFromMatch(source) : {};
    if (winner.name) participants[index] = winner;
  });
  return { ...raw, participants };
};

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
    return [groupName, roundNumber > 0 ? `Luot ${roundNumber}` : stageName || bracketName].filter(Boolean).join(" - ");
  }

  return stageName || bracketName || String(raw.name || "Knockout");
};

const readPairFromMatch = (raw: Record<string, unknown>, fallback: PlanningPair) => {
  const { teamA, teamB, nameA, nameB } = readMatchSourceLabels(raw);
  const finalNameA = nameA || fallback.teamA.name || "Seed 1";
  const finalNameB = nameB || fallback.teamB.name || "Seed 2";
  return {
    teamA: {
      id: String(teamA._id || teamA.id || ""),
      name: finalNameA,
      logo: String(teamA.logo || initialsFromSource(finalNameA) || initials(finalNameA)),
    },
    teamB: {
      id: String(teamB._id || teamB.id || ""),
      name: finalNameB,
      logo: String(teamB.logo || initialsFromSource(finalNameB) || initials(finalNameB, "-")),
    },
  };
};

const generatedMatchesFromPairs = (pairs: PlanningPair[]): ResultMatchRecord[] =>
  pairs.map((pair, index) => ({
    id: `generated-${index + 1}`,
    tournamentName: "",
    round: "Vong 1",
    stageId: "",
    matchCode: `M${index + 1}`,
    time: "",
    venue: "Sân chưa gán",
    referee: "",
    teamA: { id: pair.teamA.id, name: pair.teamA.name, logo: pair.teamA.logo, score: 0 },
    teamB: { id: pair.teamB.id, name: pair.teamB.name, logo: pair.teamB.logo, score: 0 },
    status: "pending",
    statusLabel: "Chưa diễn ra",
  }));

const statsFromMatches = (matches: ResultMatchRecord[]): ResultStat[] => [
  { id: "total", label: "Tong tran", value: matches.length, iconType: "total", color: "text-blue-600 bg-blue-100" },
  { id: "live", label: "Đang diễn ra", value: matches.filter((item) => item.status === "live").length, iconType: "live", color: "text-red-600 bg-red-100" },
  { id: "completed", label: "Đã xong", value: matches.filter((item) => ["completed", "walkover", "forfeited"].includes(item.status)).length, iconType: "completed", color: "text-green-600 bg-green-100" },
  { id: "pending", label: "Cho nhap", value: matches.filter((item) => item.status === "pending").length, iconType: "pending", color: "text-amber-600 bg-amber-100" },
  { id: "synced", label: "Dong bo", value: matches.filter((item) => !isGeneratedMatchId(item.id)).length, iconType: "synced", color: "text-purple-600 bg-purple-100" },
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
      const [stagesResponse, statusResponse, teams] = await Promise.all([
        api.get<ApiList>("/stages/tournament-item/" + tournamentItemId),
        api.get<{ data?: MatchStatusTag[] }>("/matches/status-tags"),
        fetchPlanningTeams(tournamentItemId).catch(() => []),
      ]);
      const tags = asArray(statusResponse.data);
      const stagesRaw = asArray(stagesResponse.data);
      const stages = stagesRaw.map((stage) => {
        const raw = asRecord(stage);
        return {
          id: String(raw._id || raw.id || ""),
          name: String(raw.name || "Stage"),
          order: Number(raw.number || raw.order || 0),
          standingsStatus: raw.standingsStatus === "published" ? "published" : "draft",
        } satisfies ResultStageOption;
      });
      const stageMatches = await Promise.all(stages.map((stage) => {
        return stage.id ? api.get<ApiList>("/matches/stage/" + stage.id).then((response) => asArray(response.data)) : [];
      }));
      const pairs = pairPlanningTeams(teams);
      const rawMatches = stageMatches.flat().map(asRecord);
      const matches = rawMatches.map((match, index) => {
        const raw = resolveDependencyParticipants(match, rawMatches);
        const stage = asRecord(raw.stageId);
        const group = asRecord(raw.groupId);
        const court = asRecord(raw.courtId);
        const result = asRecord(raw.matchResultId);
        const resultDetails = asRecord(result.details);
        const status = String(raw.status || "pending");
        const pair = readPairFromMatch(raw, pairs[index % Math.max(pairs.length, 1)] || {
          teamA: { id: "", name: "Seed 1", logo: "S1" },
          teamB: { id: "", name: "Seed 2", logo: "S2" },
        });
        return {
          id: String(raw._id || ""),
          tournamentName: "",
          round: buildMatchRoundLabel(raw),
          stageId: String(stage._id || raw.stageId || ""),
          groupName: group.name ? String(group.name) : "",
          courtId: String(court._id || ""),
          date: formatDate(raw.scheduledTime),
          tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
          matchCode: String(raw.name || `M${index + 1}`),
          time: formatTime(raw.scheduledTime),
          venue: String(court.name || "Sân chưa gán"),
          referee: "",
          teamA: { ...pair.teamA, score: Number(resultDetails.teamA || 0) },
          teamB: { ...pair.teamB, score: Number(resultDetails.teamB || 0) },
          status,
          statusLabel: statusLabel(status, tags),
        } satisfies ResultMatchRecord;
      });
      const plannedMatches = matches.length > 0 ? matches : generatedMatchesFromPairs(pairs);

      return {
        stats: statsFromMatches(plannedMatches),
        matches: plannedMatches,
        stages,
        statusTags: tags,
      };
    } catch (error) {
      console.error("Không thể tai kết quả thi dau tu BE.", error);
      throw error;
    }
  },

  async confirmMatchResult(match: ResultMatchRecord) {
    if (isGeneratedMatchId(match.id)) {
      throw new Error("Trận này chua duoc dong bo len backend, khong the luu bảng xếp hạng that.");
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
      throw new Error("Trận này chua duoc dong bo len backend, khong the luu điểm.");
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
