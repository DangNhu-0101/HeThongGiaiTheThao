import api from "@/libs/axios";
import type {
  CapacityData,
  ScheduleGroupGenerationPayload,
  ScheduleMatchRecord,
  ScheduleReferee,
  ScheduleStageOption,
  ScheduleStat,
  VenueColumn,
} from "@/types/orgScheduleMgmt";
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

const stageColors = [
  "bg-blue-50 text-blue-700 border-blue-200",
  "bg-emerald-50 text-emerald-700 border-emerald-200",
  "bg-amber-50 text-amber-700 border-amber-200",
  "bg-rose-50 text-rose-700 border-rose-200",
  "bg-violet-50 text-violet-700 border-violet-200",
];

const toDateInput = (value: unknown) => {
  const date = value ? new Date(String(value)) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const toTimeInput = (value: unknown) => {
  const date = value ? new Date(String(value)) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

const buildScheduledTime = (date?: string, time?: string) => {
  if (!date || !time) return undefined;
  const parsed = new Date(`${date}T${time.slice(0, 5)}:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
};

const matchIdentityKey = (raw: Record<string, unknown>) => {
  const stage = asRecord(raw.stageId);
  const stageId = String(stage._id || raw.stageId || "");
  const code = String(raw.name || "").trim().toUpperCase();
  return stageId && code ? `${stageId}:${code}` : "";
};

const matchPriority = (raw: Record<string, unknown>) => {
  const status = String(raw.status || "");
  let score = 0;
  if (status === "completed" || status === "walkover" || status === "forfeited") score += 1000;
  if (status === "live") score += 900;
  if (raw.scheduledTime) score += 600;
  if (raw.courtId) score += 200;
  if (Array.isArray(raw.refereeIds) && raw.refereeIds.length > 0) score += 100;
  if (Array.isArray(raw.participants)) {
    score += raw.participants.filter((participant) => {
      const item = asRecord(participant);
      return String(item.name || item._id || item.id || "").trim();
    }).length * 20;
  }
  if (raw.matchResultId) score += 50;
  return score;
};

const dedupeMatchesByStageAndCode = (items: unknown[]) => {
  const chosen = new Map<string, Record<string, unknown>>();
  const passthrough: Record<string, unknown>[] = [];
  items.map(asRecord).forEach((raw) => {
    const key = matchIdentityKey(raw);
    if (!key) {
      passthrough.push(raw);
      return;
    }
    const current = chosen.get(key);
    if (!current || matchPriority(raw) > matchPriority(current)) {
      chosen.set(key, raw);
    }
  });
  return [...passthrough, ...chosen.values()];
};

const stageOrderOf = (raw: Record<string, unknown>) => {
  const stage = asRecord(raw.stageId);
  return Number(stage.number || raw.round || 0);
};

const matchCodeOf = (raw: Record<string, unknown>) => String(raw.name || "").trim().toUpperCase();

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

const emptyData = () => ({
  stats: [] as ScheduleStat[],
  capacity: { referees: { used: 0, total: 0 }, venues: { used: 0, total: 0 }, schedule: { scheduled: 0, total: 0 } },
    venues: [] as VenueColumn[],
    referees: [] as ScheduleReferee[],
  stages: [] as ScheduleStageOption[],
  matches: [] as ScheduleMatchRecord[],
  needsGroupSetup: true,
});

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

const generatedMatchesFromPairs = (pairs: PlanningPair[], fallbackVenue: string): ScheduleMatchRecord[] =>
  pairs.map((pair, index) => ({
    id: `generated-${index + 1}`,
    code: `M${index + 1}`,
    stageId: "generated-stage-1",
    stageOrder: 1,
    stageName: "Vong 1",
    stageColorClass: stageColors[0],
    round: "Vong 1",
    teamA: { id: pair.teamA.id, name: pair.teamA.name, logo: pair.teamA.logo },
    teamB: { id: pair.teamB.id, name: pair.teamB.name, logo: pair.teamB.logo },
    date: "",
    time: "",
    venue: fallbackVenue,
    order: index + 1,
    referee: "",
    assistant: "",
    status: "Unscheduled",
    publishStatus: "draft",
  }));

const buildStats = (matches: ScheduleMatchRecord[]): ScheduleStat[] => {
  const scheduled = matches.filter((match) => match.status === "Scheduled").length;
  const conflicts = matches.filter((match) => match.status === "Conflict").length;
  return [
    { id: "total", label: "Tong tran", value: matches.length, iconType: "total", color: "text-blue-600 bg-blue-100" },
    { id: "scheduled", label: "Đã xếp lịch", value: scheduled, iconType: "scheduled", color: "text-green-600 bg-green-100" },
    { id: "unscheduled", label: "Chưa xếp", value: matches.length - scheduled, iconType: "unscheduled", color: "text-amber-600 bg-amber-100" },
    { id: "conflict", label: "Xung dot", value: conflicts, iconType: "conflict", color: "text-red-600 bg-red-100" },
    { id: "referee", label: "Trọng tài", value: 0, iconType: "referee", color: "text-purple-600 bg-purple-100" },
  ];
};

export const orgScheduleMgmtService = {
  async getScheduleData(tournamentItemId?: string): Promise<{
    stats: ScheduleStat[];
    capacity: CapacityData;
    venues: VenueColumn[];
    referees: ScheduleReferee[];
    stages: ScheduleStageOption[];
    matches: ScheduleMatchRecord[];
    needsGroupSetup: boolean;
  }> {
    if (!tournamentItemId) return emptyData();

    try {
      const [stagesResponse, courtsResponse, matchesResponse, refereeResponse, teams] = await Promise.all([
        api.get<ApiList>("/stages/tournament-item/" + tournamentItemId),
        api.get<ApiList>("/courts/tournament-item/" + tournamentItemId).catch(() => ({ data: [] as unknown[] })),
        api.get<ApiList>("/matches/tournament-item/" + tournamentItemId).catch(() => ({ data: [] as unknown[] })),
        api.get<ApiList>("/tournament-referees/tournament-item/" + tournamentItemId).catch(() => ({ data: [] as unknown[] })),
        fetchPlanningTeams(tournamentItemId).catch(() => []),
      ]);
      const rawStages = asArray(stagesResponse.data);
      const rawMatches = dedupeMatchesByStageAndCode(asArray(matchesResponse.data));
      const rawCourts = asArray(courtsResponse.data);
      const referees: ScheduleReferee[] = asArray(refereeResponse.data).map((item) => {
        const raw = asRecord(item);
        return {
          id: String(raw._id || raw.id || ""),
          name: String(raw.name || "Trọng tài"),
          qualification: String(raw.qualification || "Chưa cập nhật"),
          experience: Number(raw.experience || 0),
          status: String(raw.status || "available"),
        };
      }).filter((referee) => referee.id);
      const venues: VenueColumn[] = rawCourts.map((court) => {
        const raw = asRecord(court);
        const status = String(raw.status || "empty");
        return {
          id: String(raw._id || ""),
          name: String(raw.name || "Sân thi đấu"),
          statusText: status,
          isConflict: status === "busy",
        };
      });
      if (venues.length === 0) {
        venues.push({ id: "unassigned", name: "Sân chưa gán", statusText: "empty" });
      }

      const stageMeta = new Map<string, ScheduleStageOption>();
      rawStages.forEach((stage, index) => {
        const raw = asRecord(stage);
        const id = String(raw._id || "");
        if (!id) return;
        stageMeta.set(id, {
          id,
          name: String(raw.name || `Stage ${index + 1}`),
          order: Number(raw.number || raw.order || index + 1),
          colorClass: stageColors[index % stageColors.length],
          publishStatus: "draft",
        });
      });

      const fallbackVenue = venues[0]?.id || "unassigned";
      const pairs = pairPlanningTeams(teams);
      const allMatchRecords = rawMatches.map(asRecord);
      const matches = allMatchRecords.map((match, index) => {
        const raw = resolveDependencyParticipants(match, allMatchRecords);
        const stage = asRecord(raw.stageId);
        const stageId = String(stage._id || raw.stageId || "");
        const stageOption = stageMeta.get(stageId) || {
          id: stageId || "unknown-stage",
          name: String(stage.name || `Stage ${index + 1}`),
          order: Number(stage.number || 1),
          colorClass: stageColors[index % stageColors.length],
          publishStatus: "draft" as const,
        };
        const court = asRecord(raw.courtId);
        const rawReferees = Array.isArray(raw.refereeIds) ? raw.refereeIds.map(asRecord) : [];
        const scheduledTime = raw.scheduledTime;
        const pair = readPairFromMatch(raw, pairs[index % Math.max(pairs.length, 1)] || {
          teamA: { id: "", name: "Seed 1", logo: "S1" },
          teamB: { id: "", name: "Seed 2", logo: "S2" },
        });
        const publishStatus = raw.scheduleStatus === "published" ? "published" : "draft";
        const record = {
          id: String(raw._id || ""),
          code: String(raw.name || `M${index + 1}`),
          stageId: stageOption.id,
          stageOrder: stageOption.order,
          stageName: stageOption.name,
          stageColorClass: stageOption.colorClass,
          round: stageOption.name,
          teamA: pair.teamA,
          teamB: pair.teamB,
          date: toDateInput(scheduledTime),
          time: toTimeInput(scheduledTime),
          venue: String(court._id || raw.courtId || fallbackVenue),
          order: Number(raw.scheduleOrder || index + 1),
          referee: rawReferees.map((referee) => String(referee.name || "")).filter(Boolean).join(", "),
          refereeIds: rawReferees.map((referee) => String(referee._id || referee.id || "")).filter(Boolean),
          referees: rawReferees.map((referee) => ({
            id: String(referee._id || referee.id || ""),
            name: String(referee.name || "Trọng tài"),
            qualification: String(referee.qualification || "Chưa cập nhật"),
            experience: Number(referee.experience || 0),
            status: String(referee.status || ""),
          })).filter((referee) => referee.id),
          assistant: "",
          status: raw.status === "live" ? "Live" : scheduledTime ? "Scheduled" : "Unscheduled",
          publishStatus,
        } satisfies ScheduleMatchRecord;
        const currentStage = stageMeta.get(record.stageId || "");
        if (currentStage && currentStage.publishStatus !== "published" && publishStatus === "published") {
          stageMeta.set(currentStage.id, { ...currentStage, publishStatus: "published" });
        }
        return record;
      });

      const plannedMatches = matches.length > 0 ? matches : generatedMatchesFromPairs(pairs, fallbackVenue);
      const stages = Array.from(stageMeta.values()).sort((a, b) => a.order - b.order);
      if (stages.length === 0 && plannedMatches.length > 0) {
        stages.push({ id: "generated-stage-1", name: "Vong 1", order: 1, colorClass: stageColors[0], publishStatus: "draft" });
      }
      const scheduled = plannedMatches.filter((match) => match.status === "Scheduled" || match.status === "Live").length;

      return {
        stats: buildStats(plannedMatches),
        capacity: {
          referees: { used: plannedMatches.filter((match) => (match.refereeIds || []).length > 0).length, total: referees.length },
          venues: { used: venues.filter((venue) => venue.statusText !== "empty").length, total: venues.length },
          schedule: { scheduled, total: plannedMatches.length },
        },
        venues,
        referees,
        stages,
        matches: plannedMatches.sort((a, b) => (a.stageOrder || 0) - (b.stageOrder || 0) || (a.order || 0) - (b.order || 0)),
        needsGroupSetup: rawMatches.length === 0,
      };
    } catch (error) {
      console.error("Không thể tai lịch thi đấu tu BE.", error);
      return emptyData();
    }
  },

  async generateGroupStageMatches(payload: ScheduleGroupGenerationPayload) {
    const response = await api.post("/matches/group-stage/generate", payload);
    return response.data;
  },

  async updateMatchAssignment(matchId: string, updates: Partial<ScheduleMatchRecord>) {
    if (isGeneratedMatchId(matchId)) return;
    const scheduledTime = buildScheduledTime(updates.date, updates.time);
    const payload: Record<string, unknown> = {};
    if ("date" in updates || "time" in updates) payload.scheduledTime = scheduledTime || null;
    if ("venue" in updates) payload.courtId = updates.venue && updates.venue !== "unassigned" ? updates.venue : null;
    if ("refereeIds" in updates) payload.refereeIds = updates.refereeIds || [];
    if ("order" in updates) payload.scheduleOrder = updates.order;
    await api.put(`/matches/${matchId}`, payload);
  },

  async autoScheduleStage(stageId: string, startAt: string, intervalMinutes: number) {
    const response = await api.post(`/matches/stage/${stageId}/auto-schedule`, {
      startAt: new Date(startAt).toISOString(),
      intervalMinutes,
    });
    return response.data;
  },

  async publishStage(stageId: string, confirmConflicts = false) {
    const response = await api.post(`/matches/stage/${stageId}/publish`, { confirmConflicts });
    return response.data;
  },

  async publishScheduledMatches(tournamentItemId: string) {
    const response = await api.post(`/matches/tournament-item/${tournamentItemId}/publish-scheduled`);
    return response.data;
  },
};
