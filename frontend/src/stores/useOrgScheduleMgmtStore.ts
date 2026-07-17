import { create } from "zustand";
import { toast } from "sonner";
import type {
  CapacityData,
  MatchScheduleStatus,
  ScheduleGroupGenerationPayload,
  ScheduleMatchRecord,
  ScheduleReferee,
  ScheduleStageOption,
  ScheduleStat,
  VenueColumn,
} from "@/types/orgScheduleMgmt";
import { orgScheduleMgmtService } from "@/services/orgScheduleMgmtService";

const MATCH_DURATION_MINUTES = 30;

type ApiStoreError = Error & {
  title?: string;
  response?: {
    data?: {
      title?: string;
      message?: string;
      data?: {
        successCount?: number;
        failedCount?: number;
        failures?: Array<{ matchId: string; matchName: string; reason: string }>;
      };
    };
  };
};

const minutesOfDay = (time?: string) => {
  if (!time) return null;
  const [hour, minute] = time.slice(0, 5).split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
};

const durationOf = (match: Pick<ScheduleMatchRecord, "durationMinutes">) =>
  Math.max(1, Number(match.durationMinutes || MATCH_DURATION_MINUTES));

const timeFromMinutes = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

const durationFromTimeRange = (time?: string, endTime?: string) => {
  const start = minutesOfDay(time);
  const end = minutesOfDay(endTime);
  if (start === null || end === null) return null;
  return end > start ? end - start : null;
};

const windowsOverlap = (aStart: number, bStart: number, aDuration: number, bDuration: number) =>
  aStart < bStart + bDuration && bStart < aStart + aDuration;

const sameSlotKey = (match: ScheduleMatchRecord) =>
  match.venue && match.date && match.time ? `${match.venue}:${match.date}:${match.time.slice(0, 5)}` : "";

const hasSchedule = (match: Pick<ScheduleMatchRecord, "date" | "time" | "venue">) =>
  Boolean(match.date && match.time && match.venue);

const isUnscheduledMatch = (match: ScheduleMatchRecord) =>
  match.status !== "Live" && !hasSchedule(match);

const applyConflicts = (matches: ScheduleMatchRecord[]): ScheduleMatchRecord[] => {
  const counts = new Map<string, number>();
  matches.forEach((match) => {
    const key = sameSlotKey(match);
    if (key) counts.set(key, (counts.get(key) || 0) + 1);
  });
  return matches.map((match) => {
    const hasConflict = Boolean(sameSlotKey(match) && (counts.get(sameSlotKey(match)) || 0) > 1);
    const status: MatchScheduleStatus = hasConflict
      ? "Conflict"
      : match.status === "Live"
        ? "Live"
        : hasSchedule(match) ? "Scheduled" : "Unscheduled";
    return {
      ...match,
      status,
      conflictReason: hasConflict ? "Trùng sân và giờ" : undefined,
    };
  });
};

const getRefereeNames = (refereeIds: string[] = [], referees: ScheduleReferee[]) =>
  referees.filter((referee) => refereeIds.includes(referee.id)).map((referee) => referee.name).join(", ");

const sameIds = (left: string[] = [], right: string[] = []) =>
  [...new Set(left)].sort().join(":") === [...new Set(right)].sort().join(":");

const validateScheduleUpdate = (
  targetId: string,
  candidate: ScheduleMatchRecord,
  matches: ScheduleMatchRecord[],
  venues: VenueColumn[],
) => {
  if (!candidate.date || !candidate.time) return;
  const start = minutesOfDay(candidate.time);
  if (start === null) return;
  const explicitDuration = candidate.endTime ? durationFromTimeRange(candidate.time, candidate.endTime) : durationOf(candidate);
  if (explicitDuration === null) {
    throw Object.assign(new Error("Giờ kết thúc phải lớn hơn giờ bắt đầu."), {
      title: "Khung giờ chưa hợp lệ",
    });
  }
  const venueName = venues.find((venue) => venue.id === candidate.venue)?.name || candidate.venue || "Sân thi đấu";
  const refereeIds = candidate.refereeIds || [];

  for (const match of matches) {
    if (match.id === targetId || !match.date || !match.time || match.status === "Unscheduled") continue;
    if (match.date !== candidate.date) continue;
    const otherStart = minutesOfDay(match.time);
    if (otherStart === null || !windowsOverlap(start, otherStart, explicitDuration, durationOf(match))) continue;

    if (candidate.venue && match.venue === candidate.venue) {
      const otherEnd = otherStart + durationOf(match);
      throw Object.assign(new Error(`${venueName} đã có trận ${match.code} từ ${match.time.slice(0, 5)} đến ${String(Math.floor(otherEnd / 60)).padStart(2, "0")}:${String(otherEnd % 60).padStart(2, "0")}. Vui lòng chọn thời gian hoặc sân khác.`), {
        title: "Trung lịch thi đấu",
      });
    }

    const duplicatedRefereeId = refereeIds.find((id) => (match.refereeIds || []).includes(id));
    if (duplicatedRefereeId) {
      throw Object.assign(new Error("Trọng tài này đã được phân công cho một trận khác trong cùng khung giờ."), {
        title: "Trùng lịch trọng tài",
      });
    }
  }
};

const validateRefereeUpdate = (
  targetId: string,
  candidate: ScheduleMatchRecord,
  matches: ScheduleMatchRecord[],
) => {
  const start = minutesOfDay(candidate.time);
  if (!candidate.date || start === null || !(candidate.refereeIds || []).length) return;
  const explicitDuration = candidate.endTime ? durationFromTimeRange(candidate.time, candidate.endTime) : durationOf(candidate);
  if (explicitDuration === null) {
    throw Object.assign(new Error("Giờ kết thúc phải lớn hơn giờ bắt đầu."), {
      title: "Khung giờ chưa hợp lệ",
    });
  }
  const hasConflict = matches.some((match) => {
    if (match.id === targetId || match.date !== candidate.date) return false;
    if (!(match.refereeIds || []).some((id) => (candidate.refereeIds || []).includes(id))) return false;
    const otherStart = minutesOfDay(match.time);
    return otherStart !== null && windowsOverlap(start, otherStart, explicitDuration, durationOf(match));
  });
  if (hasConflict) {
    throw Object.assign(new Error("Trọng tài này đã được phân công cho một trận khác trong cùng khung giờ."), {
      title: "Trùng lịch trọng tài",
    });
  }
};

const buildStats = (matches: ScheduleMatchRecord[]): ScheduleStat[] => {
  const scheduled = matches.filter((match) => match.status === "Scheduled" || match.status === "Live").length;
  const conflicts = matches.filter((match) => match.status === "Conflict").length;
  const unscheduled = matches.filter(isUnscheduledMatch).length;
  const assignedReferees = new Set(matches.flatMap((match) => match.refereeIds || [])).size;
  return [
    { id: "total", label: "Tổng trận", value: matches.length, iconType: "total", color: "text-blue-600 bg-blue-100" },
    { id: "scheduled", label: "Đã xếp lịch", value: scheduled, iconType: "scheduled", color: "text-green-600 bg-green-100" },
    { id: "unscheduled", label: "Chưa xếp", value: unscheduled, iconType: "unscheduled", color: "text-amber-600 bg-amber-100" },
    { id: "conflict", label: "Xung đột", value: conflicts, iconType: "conflict", color: "text-red-600 bg-red-100" },
    { id: "referee", label: "Trọng tài", value: assignedReferees, iconType: "referee", color: "text-purple-600 bg-purple-100" },
  ];
};

const chooseVisibleStageId = (
  stages: ScheduleStageOption[],
  matches: ScheduleMatchRecord[],
  currentStageId: string | null,
) => {
  if (!stages.length) return null;
  const currentStageExists = Boolean(currentStageId && stages.some((stage) => stage.id === currentStageId));
  if (currentStageExists && matches.some((match) => match.stageId === currentStageId)) return currentStageId;
  const firstStageWithMatches = stages.find((stage) => matches.some((match) => match.stageId === stage.id));
  return firstStageWithMatches?.id || (currentStageExists ? currentStageId : stages[0]?.id) || null;
};

const addMinutes = (time: string, minutes: number) => {
  const start = minutesOfDay(time) ?? 8 * 60;
  const next = start + minutes;
  return timeFromMinutes(next);
};

export interface OrgScheduleMgmtState {
  stats: ScheduleStat[];
  capacity: CapacityData | null;
  venues: VenueColumn[];
  referees: ScheduleReferee[];
  stages: ScheduleStageOption[];
  matches: ScheduleMatchRecord[];
  needsGroupSetup: boolean;
  selectedStageId: string | null;
  selectedMatchId: string | null;
  currentTournamentItemId: string | null;
  loading: boolean;
  error: string | null;
  savingMatchIds: string[];
  fetchData: (tournamentItemId?: string, silent?: boolean) => Promise<void>;
  setSelectedStageId: (id: string | null) => void;
  selectPreviousStage: () => void;
  selectNextStage: () => void;
  setSelectedMatchId: (id: string | null) => void;
  updateMatchAssignment: (id: string, updates: Partial<ScheduleMatchRecord>) => Promise<void>;
  moveMatchToVenue: (id: string, venue: string, date?: string, time?: string, order?: number) => Promise<void>;
  moveMatchToUnscheduled: (id: string) => Promise<void>;
  autoScheduleStage: (stageId: string, startAt: string, intervalMinutes: number) => Promise<void>;
  quickAssignVenues: (stageId: string, date: string, startTime?: string) => Promise<void>;
  quickAssignReferees: (stageId: string) => Promise<void>;
  publishStage: (stageId: string, confirmConflicts?: boolean) => Promise<void>;
  publishScheduledMatches: (tournamentItemId: string) => Promise<void>;
  generateGroupStage: (payload: ScheduleGroupGenerationPayload) => Promise<void>;
}

export const useOrgScheduleMgmtStore = create<OrgScheduleMgmtState>((set, get) => ({
  stats: [],
  capacity: null,
  venues: [],
  referees: [],
  stages: [],
  matches: [],
  needsGroupSetup: false,
  selectedStageId: null,
  selectedMatchId: null,
  currentTournamentItemId: null,
  loading: false,
  error: null,
  savingMatchIds: [],

  fetchData: async (tournamentItemId, silent = false) => {
    if (!silent) set({ loading: true, error: null });
    try {
      const data = await orgScheduleMgmtService.getScheduleData(tournamentItemId);
      const matches = applyConflicts(data.matches);
      const selectedStageId = chooseVisibleStageId(data.stages, matches, get().selectedStageId);
      set({
        stats: buildStats(matches),
        capacity: data.capacity,
        venues: data.venues,
        referees: data.referees,
        stages: data.stages,
        matches,
        needsGroupSetup: data.needsGroupSetup,
        currentTournamentItemId: tournamentItemId || null,
        selectedStageId,
        selectedMatchId: null,
        error: null,
      });
    } catch (error) {
      console.error("Lỗi tai dữ liệu lịch thi đấu:", error);
      const apiError = error as ApiStoreError;
      set({
        matches: [],
        needsGroupSetup: false,
        error: apiError.response?.data?.message || apiError.message || "Không thể tải dữ liệu trận đấu. Vui lòng thử lại.",
      });
    } finally {
      if (!silent) set({ loading: false });
    }
  },

  setSelectedStageId: (id) => set({ selectedStageId: id, selectedMatchId: null }),

  selectPreviousStage: () => set((state) => {
    const index = state.stages.findIndex((stage) => stage.id === state.selectedStageId);
    const previous = state.stages[Math.max(0, index - 1)];
    return { selectedStageId: previous?.id || state.selectedStageId, selectedMatchId: null };
  }),

  selectNextStage: () => set((state) => {
    const index = state.stages.findIndex((stage) => stage.id === state.selectedStageId);
    const next = state.stages[Math.min(state.stages.length - 1, index + 1)];
    return { selectedStageId: next?.id || state.selectedStageId, selectedMatchId: null };
  }),

  setSelectedMatchId: (id) => set({ selectedMatchId: id }),

  updateMatchAssignment: async (id, updates) => {
    const previousMatches = get().matches;
    const current = previousMatches.find((match) => match.id === id);
    if (!current) return;
    const candidate = { ...current, ...updates };
    const rangeDuration = candidate.endTime ? durationFromTimeRange(candidate.time, candidate.endTime) : null;
    if (rangeDuration !== null) candidate.durationMinutes = rangeDuration;
    const scheduleChanged = candidate.date !== current.date
      || candidate.time !== current.time
      || candidate.endTime !== current.endTime
      || candidate.durationMinutes !== current.durationMinutes
      || candidate.venue !== current.venue
      || candidate.order !== current.order;
    const refereeChanged = !sameIds(candidate.refereeIds, current.refereeIds);
    if (!scheduleChanged && !refereeChanged) return;
    try {
      if (scheduleChanged) {
        validateScheduleUpdate(id, candidate, previousMatches, get().venues);
      } else {
        validateRefereeUpdate(id, candidate, previousMatches);
      }
    } catch (error: unknown) {
      toast.error((error as ApiStoreError).title || "Không thể lưu phân công", {
        description: (error as ApiStoreError).message || "Dữ liệu lịch thi đấu chưa hợp lệ.",
      });
      throw error;
    }

    const referee = getRefereeNames(candidate.refereeIds, get().referees);
    const refereeRecords = get().referees.filter((item) => (candidate.refereeIds || []).includes(item.id));
    const nextMatches = applyConflicts(previousMatches.map((match) => match.id === id ? { ...candidate, referee, referees: refereeRecords } : match));
    set((state) => ({ savingMatchIds: [...new Set([...state.savingMatchIds, id])], matches: nextMatches, stats: buildStats(nextMatches) }));
    try {
      if (scheduleChanged) {
        await orgScheduleMgmtService.updateMatchAssignment(id, {
          date: candidate.date,
          time: candidate.time,
          endTime: candidate.endTime,
          durationMinutes: candidate.durationMinutes,
          venue: candidate.venue,
          order: candidate.order,
        });
      }
      if (refereeChanged) {
        await orgScheduleMgmtService.updateMatchReferees(id, candidate.refereeIds || []);
        const tournamentItemId = get().currentTournamentItemId;
        if (tournamentItemId) {
          const data = await orgScheduleMgmtService.getScheduleData(tournamentItemId);
          const matches = applyConflicts(data.matches);
          set({
            stats: buildStats(matches),
            capacity: data.capacity,
            venues: data.venues,
            referees: data.referees,
            stages: data.stages,
            matches,
            needsGroupSetup: data.needsGroupSetup,
            selectedStageId: chooseVisibleStageId(data.stages, matches, get().selectedStageId),
          });
        }
      }
      toast.success("Đã lưu thành công!");
    } catch (error) {
      const message = (error as ApiStoreError).response?.data?.message || (error as Error)?.message || "Có lỗi xảy ra khi lưu dữ liệu. Vui lòng thử lại.";
      const title = (error as ApiStoreError).response?.data?.title || "Không thể lưu phân công";
      const rolledBack = applyConflicts(previousMatches);
      set({ matches: rolledBack, stats: buildStats(rolledBack) });
      toast.error(title, { description: message });
      console.error("Lỗi lưu lịch thi đấu:", error);
      throw error;
    } finally {
      set((state) => ({ savingMatchIds: state.savingMatchIds.filter((matchId) => matchId !== id) }));
    }
  },

  moveMatchToVenue: async (id, venue, date, time, order) => {
    const match = get().matches.find((item) => item.id === id);
    if (!match) return;
    await get().updateMatchAssignment(id, {
      venue,
      date: date !== undefined ? date : match.date,
      time: time !== undefined ? time : match.time,
      order: order || match.order,
    });
  },

  moveMatchToUnscheduled: async (id) => {
    await get().updateMatchAssignment(id, {
      venue: "",
      date: "",
      time: "",
      endTime: "",
      durationMinutes: MATCH_DURATION_MINUTES,
      order: 0,
    });
  },

  autoScheduleStage: async (stageId, startAt, intervalMinutes) => {
    try {
      await orgScheduleMgmtService.autoScheduleStage(stageId, startAt, intervalMinutes);
      const selectedStageId = get().selectedStageId;
      const tournamentItemId = get().currentTournamentItemId;
      if (tournamentItemId) {
        const data = await orgScheduleMgmtService.getScheduleData(tournamentItemId);
        const matches = applyConflicts(data.matches);
        const nextSelectedStageId = chooseVisibleStageId(data.stages, matches, selectedStageId);
        set({
          stats: buildStats(matches),
          capacity: data.capacity,
          venues: data.venues,
          referees: data.referees,
          stages: data.stages,
          matches,
          needsGroupSetup: data.needsGroupSetup,
          selectedStageId: nextSelectedStageId,
          selectedMatchId: null,
        });
      }
      toast.success("Đã xếp lịch tự động thành công!");
    } catch (error: unknown) {
      toast.error((error as ApiStoreError).response?.data?.title || "Không thể xếp lịch tự động", {
        description: (error as ApiStoreError).response?.data?.message || "Có lỗi xảy ra khi xếp lịch. Vui lòng thử lại.",
      });
    }
  },

  quickAssignVenues: async (stageId, date, startTime = "08:00") => {
    const venues = get().venues.filter((venue) => venue.id && venue.id !== "unassigned");
    const stageMatches = get().matches
      .filter((match) => match.stageId === stageId)
      .sort((a, b) => (a.order || 0) - (b.order || 0) || a.code.localeCompare(b.code));
    if (venues.length === 0 || stageMatches.length === 0) {
      toast.error("Không thể phân sân nhanh", { description: "Cần có sân thi đấu và danh sách trận trước khi phân sân." });
      return;
    }

    const previousMatches = get().matches;
    let nextMatches = previousMatches;
    try {
      stageMatches.forEach((match, index) => {
        const venue = venues[index % venues.length];
        const round = Math.floor(index / venues.length);
        const candidate = {
          ...match,
          venue: venue.id,
          date: match.date || date,
          time: match.time || addMinutes(startTime, round * MATCH_DURATION_MINUTES),
          endTime: match.endTime || addMinutes(match.time || addMinutes(startTime, round * MATCH_DURATION_MINUTES), durationOf(match)),
          order: index + 1,
        };
        validateScheduleUpdate(match.id, candidate, nextMatches, venues);
        nextMatches = nextMatches.map((item) => item.id === match.id ? candidate : item);
      });
    } catch (error: unknown) {
      toast.error((error as ApiStoreError).title || "Không thể phân sân nhanh", {
        description: (error as ApiStoreError).message || "Lịch phân sân bị trùng khung giờ.",
      });
      throw error;
    }

    const applied = applyConflicts(nextMatches);
    set({ matches: applied, stats: buildStats(applied) });
    try {
      await Promise.all(stageMatches.map((match) => {
        const updated = applied.find((item) => item.id === match.id);
        return updated ? orgScheduleMgmtService.updateMatchAssignment(match.id, updated) : Promise.resolve();
      }));
      toast.success("Đã phân sân nhanh cho stage hiện tại.");
    } catch (error: unknown) {
      const rolledBack = applyConflicts(previousMatches);
      set({ matches: rolledBack, stats: buildStats(rolledBack) });
      toast.error("Không thể lưu phân sân nhanh", {
        description: (error as ApiStoreError).response?.data?.message || "Dữ liệu đã được khôi phục. Vui lòng thử lại.",
      });
      throw error;
    }
  },

  quickAssignReferees: async (stageId) => {
    try {
      const result = await orgScheduleMgmtService.quickAssignStageReferees(stageId);
      const tournamentItemId = get().currentTournamentItemId;
      if (tournamentItemId) {
        const data = await orgScheduleMgmtService.getScheduleData(tournamentItemId);
        const matches = applyConflicts(data.matches);
        set({
          stats: buildStats(matches),
          capacity: data.capacity,
          venues: data.venues,
          referees: data.referees,
          stages: data.stages,
          matches,
          needsGroupSetup: data.needsGroupSetup,
          selectedStageId: chooseVisibleStageId(data.stages, matches, stageId),
        });
      }
      const failureDetails = result.failures.map((failure) => `${failure.matchName}: ${failure.reason}`).join("; ");
      if (result.successCount > 0) {
        toast.success(`Đã phân công trọng tài cho ${result.successCount} trận.`, {
          description: result.failedCount > 0
            ? `${result.failedCount} trận chưa phân công được. ${failureDetails}`
            : undefined,
        });
      } else {
        toast.error("Không có trận nào được phân công trọng tài", {
          description: failureDetails || "Không có trọng tài phù hợp với các khung giờ hiện tại.",
        });
      }
    } catch (error: unknown) {
      const response = (error as ApiStoreError).response?.data;
      const failures = response?.data?.failures || [];
      const failureDetails = failures.map((failure) => `${failure.matchName}: ${failure.reason}`).join("; ");
      toast.error(response?.title || "Không thể phân công trọng tài", {
        description: [response?.message, failureDetails].filter(Boolean).join(". ") || "Có lỗi xảy ra khi phân công trọng tài.",
      });
    }
  },

  publishStage: async (stageId, confirmConflicts = false) => {
    try {
      await orgScheduleMgmtService.publishStage(stageId, confirmConflicts);
      set((state) => ({
        stages: state.stages.map((stage) => stage.id === stageId ? { ...stage, publishStatus: "published" } : stage),
        matches: state.matches.map((match) => match.stageId === stageId ? { ...match, publishStatus: "published" } : match),
      }));
      toast.success("Đã công bố lịch thi đấu.");
    } catch (error: unknown) {
      toast.error((error as ApiStoreError).response?.data?.title || "Không thể công bố lịch", {
        description: (error as ApiStoreError).response?.data?.message || "Hãy kiểm tra xung đột sân/giờ rồi thử lại.",
      });
    }
  },

  publishScheduledMatches: async (tournamentItemId) => {
    try {
      await orgScheduleMgmtService.publishScheduledMatches(tournamentItemId);
      const data = await orgScheduleMgmtService.getScheduleData(tournamentItemId);
      const matches = applyConflicts(data.matches);
      const selectedStageId = chooseVisibleStageId(data.stages, matches, get().selectedStageId);
      set({
        stats: buildStats(matches),
        capacity: data.capacity,
        venues: data.venues,
        referees: data.referees,
        stages: data.stages,
        matches,
        needsGroupSetup: data.needsGroupSetup,
        selectedStageId,
        selectedMatchId: null,
      });
      toast.success("Đã công bố tất cả trận đã xếp lịch.");
      window.dispatchEvent(new CustomEvent("tournament-schedule-published", { detail: { tournamentItemId } }));
    } catch (error: unknown) {
      toast.error("Chưa thể công bố lịch", {
        description: (error as ApiStoreError).response?.data?.message || "Vui lòng thử lại sau.",
      });
      throw error;
    }
  },

  generateGroupStage: async (payload) => {
    try {
      await orgScheduleMgmtService.generateGroupStageMatches(payload);
      const data = await orgScheduleMgmtService.getScheduleData(payload.tournamentItemId);
      const matches = applyConflicts(data.matches);
      const selectedStageId = chooseVisibleStageId(data.stages, matches, data.stages[0]?.id || null);
      set({
        stats: buildStats(matches),
        capacity: data.capacity,
        venues: data.venues,
        referees: data.referees,
        stages: data.stages,
        matches,
        needsGroupSetup: data.needsGroupSetup,
        currentTournamentItemId: payload.tournamentItemId,
        selectedStageId,
        selectedMatchId: null,
      });
      toast.success("Đã sinh trận vòng bảng.");
    } catch (error: unknown) {
      toast.error((error as ApiStoreError).response?.data?.title || "Không thể sinh trận", {
        description: (error as ApiStoreError).response?.data?.message || "Vui lòng kiểm tra danh sách đội và cấu hình stage.",
      });
    }
  },
}));


