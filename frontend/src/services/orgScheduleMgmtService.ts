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
import { asArray, asRecord, isGeneratedMatchId } from "@/services/orgMatchPlanningService";
import { initialsFromSource, readMatchSourceLabels } from "@/utils/matchSourceLabels";

type ApiList<T = unknown> = T[] | { data?: T[]; success?: boolean };

export interface QuickRefereeAssignmentResult {
  successCount: number;
  failedCount: number;
  failures: Array<{ matchId: string; matchName: string; reason: string }>;
}

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

const timeAfterMinutes = (value: unknown, minutes: number) => {
  const date = value ? new Date(String(value)) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  date.setMinutes(date.getMinutes() + Math.max(1, minutes));
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

const minutesOfDay = (time?: string) => {
  if (!time) return null;
  const [hour, minute] = time.slice(0, 5).split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
};

const durationFromTimes = (start?: string, end?: string) => {
  const startMinutes = minutesOfDay(start);
  const endMinutes = minutesOfDay(end);
  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) return null;
  return endMinutes - startMinutes;
};

const buildScheduledTime = (date?: string, time?: string) => {
  if (!date || !time) return undefined;
  const parsed = new Date(`${date}T${time.slice(0, 5)}:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
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

const matchIdentityKey = (raw: Record<string, unknown>) => {
  const stage = asRecord(raw.stageId);
  const stageId = String(stage._id || raw.stageId || "");
  const code = String(raw.name || "").trim().toUpperCase();
  return stageId && code ? `${stageId}:${code}` : "";
};

const matchPriority = (raw: Record<string, unknown>) => {
  const status = String(raw.status || "");
  let score = 0;
  if (["completed", "walkover", "forfeited"].includes(status)) score += 1000;
  if (status === "live") score += 900;
  if (raw.scheduledTime) score += 600;
  if (raw.courtId) score += 200;
  if (Array.isArray(raw.refereeIds) && raw.refereeIds.length > 0) score += 100;
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
    if (!current || matchPriority(raw) > matchPriority(current)) chosen.set(key, raw);
  });
  return [...passthrough, ...chosen.values()];
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

const buildStats = (matches: ScheduleMatchRecord[]): ScheduleStat[] => {
  const scheduled = matches.filter((match) => match.status === "Scheduled" || match.status === "Live").length;
  const conflicts = matches.filter((match) => match.status === "Conflict").length;
  return [
    { id: "total", label: "Tổng trận", value: matches.length, iconType: "total", color: "text-blue-600 bg-blue-100" },
    { id: "scheduled", label: "Đã xếp lịch", value: scheduled, iconType: "scheduled", color: "text-green-600 bg-green-100" },
    { id: "unscheduled", label: "Chưa xếp", value: matches.length - scheduled, iconType: "unscheduled", color: "text-amber-600 bg-amber-100" },
    { id: "conflict", label: "Xung đột", value: conflicts, iconType: "conflict", color: "text-red-600 bg-red-100" },
    { id: "referee", label: "Trọng tài", value: 0, iconType: "referee", color: "text-purple-600 bg-purple-100" },
  ];
};

const mapReferee = (item: unknown): ScheduleReferee | null => {
  const raw = asRecord(item);
  const id = String(raw._id || raw.id || "");
  if (!id) return null;
  return {
    id,
    name: String(raw.name || "Trọng tài"),
    qualification: String(raw.qualification || "Chưa cập nhật"),
    experience: Number(raw.experience || 0),
    status: String(raw.status || "available"),
  };
};

const readEntityId = (item: unknown) => {
  if (typeof item === "string" || typeof item === "number") return String(item);
  const raw = asRecord(item);
  return String(raw._id || raw.id || "");
};

const mapVenue = (item: unknown): VenueColumn | null => {
  const raw = asRecord(item);
  const id = String(raw._id || raw.id || "");
  if (!id) return null;
  const status = String(raw.status || "empty");
  return {
    id,
    name: String(raw.name || "Sân thi đấu"),
    statusText: status,
    isConflict: status === "busy",
  };
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
      const [stagesResponse, courtsResponse, matchesResponse, refereeResponse] = await Promise.all([
        api.get<ApiList>("/stages/tournament-item/" + tournamentItemId),
        api.get<ApiList>("/courts/tournament-item/" + tournamentItemId).catch(() => ({ data: [] as unknown[] })),
        api.get<ApiList>("/matches/tournament-item/" + tournamentItemId),
        api.get<ApiList>("/tournament-referees/tournament-item/" + tournamentItemId).catch(() => ({ data: [] as unknown[] })),
      ]);

      const rawStages = asArray(stagesResponse.data);
      const rawMatches = dedupeMatchesByStageAndCode(asArray(matchesResponse.data));
      const venues = asArray(courtsResponse.data).map(mapVenue).filter((venue): venue is VenueColumn => Boolean(venue));
      const referees = asArray(refereeResponse.data)
        .map(mapReferee)
        .filter((referee): referee is ScheduleReferee => referee !== null && referee.status !== "unavailable");
      const refereeById = new Map(referees.map((referee) => [referee.id, referee]));
      const inferredDurationByStage = new Map<string, number>();
      const timesByStage = new Map<string, number[]>();
      rawMatches.forEach((raw) => {
        const stage = asRecord(raw.stageId);
        const stageId = String(stage._id || raw.stageId || "");
        const timestamp = raw.scheduledTime ? new Date(String(raw.scheduledTime)).getTime() : Number.NaN;
        if (!stageId || !Number.isFinite(timestamp)) return;
        timesByStage.set(stageId, [...(timesByStage.get(stageId) || []), timestamp]);
      });
      timesByStage.forEach((timestamps, stageId) => {
        const uniqueTimes = [...new Set(timestamps)].sort((a, b) => a - b);
        const gaps = uniqueTimes.slice(1)
          .map((timestamp, index) => (timestamp - uniqueTimes[index]) / 60000)
          .filter((minutes) => Number.isFinite(minutes) && minutes > 0);
        inferredDurationByStage.set(stageId, gaps.length > 0 ? Math.max(1, Math.min(...gaps)) : 30);
      });

      const stageMeta = new Map<string, ScheduleStageOption>();
      rawStages.forEach((stage, index) => {
        const raw = asRecord(stage);
        const id = String(raw._id || raw.id || "");
        if (!id) return;
        stageMeta.set(id, {
          id,
          name: String(raw.name || `Stage ${index + 1}`),
          order: Number(raw.number || raw.order || index + 1),
          colorClass: stageColors[index % stageColors.length],
          publishStatus: "draft",
        });
      });

      const matches = rawMatches.map((raw, index) => {
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
        const rawReferees = Array.isArray(raw.refereeIds) ? raw.refereeIds : [];
        const persistedRefereeIds = rawReferees.map(readEntityId).filter(Boolean);
        const refereeRecords = persistedRefereeIds
          .map((id) => refereeById.get(id) || null)
          .filter((referee): referee is ScheduleReferee => Boolean(referee));
        const refereeIds = refereeRecords.map((referee) => referee.id);
        const refereeName = refereeRecords.map((referee) => referee.name).filter(Boolean).join(", ");
        const scheduledTime = raw.scheduledTime;
        const durationMinutes = Math.max(1, Number(raw.durationMinutes || inferredDurationByStage.get(stageOption.id) || 30));
        const pair = readPairFromMatch(raw);
        const publishStatus = raw.scheduleStatus === "published" ? "published" : "draft";
        const record = {
          id: String(raw._id || raw.id || ""),
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
          endTime: timeAfterMinutes(scheduledTime, durationMinutes),
          durationMinutes,
          venue: String(court._id || raw.courtId || ""),
          order: Number(raw.scheduleOrder || index + 1),
          referee: refereeName,
          refereeIds,
          referees: refereeRecords,
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

      const scheduled = matches.filter((match) => match.status === "Scheduled" || match.status === "Live").length;

      return {
        stats: buildStats(matches),
        capacity: {
          referees: { used: matches.filter((match) => (match.refereeIds || []).length > 0).length, total: referees.length },
          venues: { used: venues.filter((venue) => venue.statusText !== "empty").length, total: venues.length },
          schedule: { scheduled, total: matches.length },
        },
        venues,
        referees,
        stages: Array.from(stageMeta.values()).sort((a, b) => a.order - b.order),
        matches: matches.sort((a, b) => (a.stageOrder || 0) - (b.stageOrder || 0) || (a.order || 0) - (b.order || 0)),
        needsGroupSetup: rawMatches.length === 0,
      };
    } catch (error) {
      console.error("Không thể tải lịch thi đấu từ BE.", error);
      throw error;
    }
  },

  async generateGroupStageMatches(payload: ScheduleGroupGenerationPayload) {
    const response = await api.post("/matches/group-stage/generate", payload);
    return response.data;
  },

  async updateMatchAssignment(matchId: string, updates: Partial<ScheduleMatchRecord>) {
    if (isGeneratedMatchId(matchId)) return;
    const scheduledTime = buildScheduledTime(updates.date, updates.time);
    const explicitDuration = durationFromTimes(updates.time, updates.endTime);
    const payload: Record<string, unknown> = {};
    if ("date" in updates || "time" in updates) payload.scheduledTime = scheduledTime || null;
    if ("endTime" in updates || explicitDuration !== null) payload.durationMinutes = explicitDuration ?? updates.durationMinutes ?? null;
    else if ("durationMinutes" in updates) payload.durationMinutes = updates.durationMinutes;
    if ("venue" in updates) payload.courtId = updates.venue || null;
    if ("order" in updates) payload.scheduleOrder = updates.order;
    if (Object.keys(payload).length > 0) await api.put(`/matches/${matchId}`, payload);
  },

  async updateMatchReferees(matchId: string, refereeIds: string[]) {
    if (isGeneratedMatchId(matchId)) return;
    const response = await api.patch(`/matches/${matchId}/referees`, { refereeIds });
    return response.data;
  },

  async quickAssignStageReferees(stageId: string): Promise<QuickRefereeAssignmentResult> {
    const response = await api.post(`/matches/stage/${stageId}/assign-referees`);
    return response.data.data as QuickRefereeAssignmentResult;
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
