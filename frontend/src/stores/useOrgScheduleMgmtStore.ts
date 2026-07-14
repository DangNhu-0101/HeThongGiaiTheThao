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

const minutesOfDay = (time?: string) => {
  if (!time) return null;
  const [hour, minute] = time.slice(0, 5).split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
};

const windowsOverlap = (aStart: number, bStart: number, duration = MATCH_DURATION_MINUTES) =>
  aStart < bStart + duration && bStart < aStart + duration;

const sameSlotKey = (match: ScheduleMatchRecord) =>
  match.venue && match.date && match.time ? `${match.venue}:${match.date}:${match.time.slice(0, 5)}` : "";

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
        : match.date && match.time && match.venue ? "Scheduled" : "Unscheduled";
    return {
      ...match,
      status,
      conflictReason: hasConflict ? "Trung sân va gio" : undefined,
    };
  });
};

const getRefereeNames = (refereeIds: string[] = [], referees: ScheduleReferee[]) =>
  referees.filter((referee) => refereeIds.includes(referee.id)).map((referee) => referee.name).join(", ");

const validateScheduleUpdate = (
  targetId: string,
  candidate: ScheduleMatchRecord,
  matches: ScheduleMatchRecord[],
  venues: VenueColumn[],
  referees: ScheduleReferee[],
) => {
  if (!candidate.date || !candidate.time) return;
  const start = minutesOfDay(candidate.time);
  if (start === null) return;
  const venueName = venues.find((venue) => venue.id === candidate.venue)?.name || candidate.venue || "Sân thi đấu";
  const refereeIds = candidate.refereeIds || [];

  for (const match of matches) {
    if (match.id === targetId || !match.date || !match.time || match.status === "Unscheduled") continue;
    if (match.date !== candidate.date) continue;
    const otherStart = minutesOfDay(match.time);
    if (otherStart === null || !windowsOverlap(start, otherStart)) continue;

    if (candidate.venue && match.venue === candidate.venue) {
      throw Object.assign(new Error(`${venueName} da co trận ${match.code} tu ${match.time.slice(0, 5)} den ${String(Math.floor((otherStart + MATCH_DURATION_MINUTES) / 60)).padStart(2, "0")}:${String((otherStart + MATCH_DURATION_MINUTES) % 60).padStart(2, "0")}. Vui lòng chon thời gian hoac sân khac.`), {
        title: "Trung lịch thi đấu",
      });
    }

    const duplicatedRefereeId = refereeIds.find((id) => (match.refereeIds || []).includes(id));
    if (duplicatedRefereeId) {
      const refereeName = referees.find((referee) => referee.id === duplicatedRefereeId)?.name || "Trọng tài";
      throw Object.assign(new Error(`${refereeName} da duoc phan cong o trận ${match.code} trong cung khung gio. Vui lòng chon trọng tài khac.`), {
        title: "Trung lich trọng tài",
      });
    }
  }
};

const buildStats = (matches: ScheduleMatchRecord[]): ScheduleStat[] => {
  const scheduled = matches.filter((match) => match.status === "Scheduled" || match.status === "Live").length;
  const conflicts = matches.filter((match) => match.status === "Conflict").length;
  const assignedReferees = new Set(matches.flatMap((match) => match.refereeIds || [])).size;
  return [
    { id: "total", label: "Tong tran", value: matches.length, iconType: "total", color: "text-blue-600 bg-blue-100" },
    { id: "scheduled", label: "Đã xếp lịch", value: scheduled, iconType: "scheduled", color: "text-green-600 bg-green-100" },
    { id: "unscheduled", label: "Chưa xếp", value: matches.length - scheduled - conflicts, iconType: "unscheduled", color: "text-amber-600 bg-amber-100" },
    { id: "conflict", label: "Xung dot", value: conflicts, iconType: "conflict", color: "text-red-600 bg-red-100" },
    { id: "referee", label: "Trọng tài", value: assignedReferees, iconType: "referee", color: "text-purple-600 bg-purple-100" },
  ];
};

const addMinutes = (time: string, minutes: number) => {
  const start = minutesOfDay(time) ?? 8 * 60;
  const next = start + minutes;
  return `${String(Math.floor(next / 60)).padStart(2, "0")}:${String(next % 60).padStart(2, "0")}`;
};

const isScheduled = (match: ScheduleMatchRecord) => Boolean(match.date && match.time && match.venue);

const findRefereeConflict = (
  refereeId: string,
  candidate: ScheduleMatchRecord,
  matches: ScheduleMatchRecord[],
) => {
  const start = minutesOfDay(candidate.time);
  if (!candidate.date || start === null) return undefined;
  return matches.find((match) => {
    if (match.id === candidate.id || match.date !== candidate.date || !(match.refereeIds || []).includes(refereeId)) return false;
    const otherStart = minutesOfDay(match.time);
    return otherStart !== null && windowsOverlap(start, otherStart);
  });
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
  savingMatchIds: [],

  fetchData: async (tournamentItemId, silent = false) => {
    if (!silent) set({ loading: true });
    try {
      const data = await orgScheduleMgmtService.getScheduleData(tournamentItemId);
      const matches = applyConflicts(data.matches);
      const selectedStageId = get().selectedStageId && data.stages.some((stage) => stage.id === get().selectedStageId)
        ? get().selectedStageId
        : data.stages[0]?.id || null;
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
      });
    } catch (error) {
      console.error("Lỗi tai dữ liệu lịch thi đấu:", error);
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
    try {
      validateScheduleUpdate(id, candidate, previousMatches, get().venues, get().referees);
    } catch (error: any) {
      toast.error(error?.title || "Không thể luu phan cong", {
        description: error?.message || "Dữ liệu lịch thi đấu chua hop le.",
      });
      throw error;
    }

    const referee = getRefereeNames(candidate.refereeIds, get().referees);
    const refereeRecords = get().referees.filter((item) => (candidate.refereeIds || []).includes(item.id));
    const nextMatches = applyConflicts(previousMatches.map((match) => match.id === id ? { ...candidate, referee, referees: refereeRecords } : match));
    set((state) => ({ savingMatchIds: [...new Set([...state.savingMatchIds, id])], matches: nextMatches, stats: buildStats(nextMatches) }));
    try {
      const updated = nextMatches.find((match) => match.id === id);
      await orgScheduleMgmtService.updateMatchAssignment(id, { ...updated, ...updates });
      toast.success("Đã lưu thành công!");
    } catch (error) {
      const message = (error as any)?.response?.data?.message || (error as Error)?.message || "Co lỗi xay ra khi luu dữ liệu. Vui lòng thử lại.";
      const title = (error as any)?.response?.data?.title || "Không thể luu phan cong";
      const rolledBack = applyConflicts(previousMatches);
      set({ matches: rolledBack, stats: buildStats(rolledBack) });
      toast.error(title, { description: message });
      console.error("Lỗi luu lịch thi đấu:", error);
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
      }
      toast.success("Đã xếp lịch tu dong thành công!");
    } catch (error: any) {
      toast.error(error?.response?.data?.title || "Không thể xếp lịch tu dong", {
        description: error?.response?.data?.message || "Co lỗi xay ra khi xếp lịch. Vui lòng thử lại.",
      });
    }
  },

  quickAssignVenues: async (stageId, date, startTime = "08:00") => {
    const venues = get().venues.filter((venue) => venue.id && venue.id !== "unassigned");
    const stageMatches = get().matches
      .filter((match) => match.stageId === stageId)
      .sort((a, b) => (a.order || 0) - (b.order || 0) || a.code.localeCompare(b.code));
    if (venues.length === 0 || stageMatches.length === 0) {
      toast.error("Không thể phan sân nhanh", { description: "Can co sân thi dau va danh sach trận truoc khi phan san." });
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
          order: index + 1,
        };
        validateScheduleUpdate(match.id, candidate, nextMatches, venues, get().referees);
        nextMatches = nextMatches.map((item) => item.id === match.id ? candidate : item);
      });
    } catch (error: any) {
      toast.error(error?.title || "Không thể phan sân nhanh", {
        description: error?.message || "Lich phan sân bi trung khung gio.",
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
      toast.success("Đã phân sân nhanh cho stage hien tai.");
    } catch (error: any) {
      const rolledBack = applyConflicts(previousMatches);
      set({ matches: rolledBack, stats: buildStats(rolledBack) });
      toast.error("Không thể luu phan sân nhanh", {
        description: error?.response?.data?.message || "Dữ liệu da duoc khoi phuc. Vui lòng thử lại.",
      });
      throw error;
    }
  },

  quickAssignReferees: async (stageId) => {
    const referees = get().referees.filter((referee) => referee.status !== "unavailable");
    const stageMatches = get().matches
      .filter((match) => match.stageId === stageId)
      .sort((a, b) => `${a.date || ""} ${a.time || ""}`.localeCompare(`${b.date || ""} ${b.time || ""}`) || (a.order || 0) - (b.order || 0));
    if (referees.length === 0) {
      toast.error("Không thể phan cong trọng tài", { description: "Chưa có trọng tài kha dung cho giai nay." });
      return;
    }
    const missingSchedule = stageMatches.find((match) => !isScheduled(match));
    if (missingSchedule) {
      toast.error("Can xep sân va gio truoc", {
        description: `Trận ${missingSchedule.code} chưa có đủ sân, ngày và giờ. Hãy xếp lịch tự động/phân sân trước khi phân công trọng tài.`,
      });
      return;
    }

    const previousMatches = get().matches;
    let nextMatches = previousMatches;
    try {
      stageMatches.forEach((match) => {
        const referee = referees.find((item) => !findRefereeConflict(item.id, match, nextMatches));
        if (!referee) {
          throw Object.assign(new Error(`Không cón trọng tài ranh cho trận ${match.code} luc ${match.time} ngay ${match.date}.`), {
            title: "Xung dot trọng tài",
          });
        }
        const candidate = {
          ...match,
          refereeIds: [referee.id],
          referee: referee.name,
          referees: [referee],
        };
        validateScheduleUpdate(match.id, candidate, nextMatches, get().venues, referees);
        nextMatches = nextMatches.map((item) => item.id === match.id ? candidate : item);
      });
    } catch (error: any) {
      toast.error(error?.title || "Không thể phan cong trọng tài", {
        description: error?.message || "Co xung dot trọng tài trong cung khung gio.",
      });
      throw error;
    }

    const applied = applyConflicts(nextMatches);
    set({ matches: applied, stats: buildStats(applied) });
    try {
      await Promise.all(stageMatches.map((match) => {
        const updated = applied.find((item) => item.id === match.id);
        return updated ? orgScheduleMgmtService.updateMatchAssignment(match.id, { refereeIds: updated.refereeIds }) : Promise.resolve();
      }));
      toast.success("Đã phân cong trọng tài nhanh.");
    } catch (error: any) {
      const rolledBack = applyConflicts(previousMatches);
      set({ matches: rolledBack, stats: buildStats(rolledBack) });
      toast.error("Không thể luu phan cong trọng tài", {
        description: error?.response?.data?.message || "Dữ liệu da duoc khoi phuc. Vui lòng thử lại.",
      });
      throw error;
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
    } catch (error: any) {
      toast.error(error?.response?.data?.title || "Không thể công bố lich", {
        description: error?.response?.data?.message || "Hay kiểm tra xung dot san/gio roi thử lại.",
      });
    }
  },

  publishScheduledMatches: async (tournamentItemId) => {
    try {
      await orgScheduleMgmtService.publishScheduledMatches(tournamentItemId);
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
        selectedMatchId: null,
      });
      toast.success("Đã công bố tat ca trận da xếp lịch.");
      window.dispatchEvent(new CustomEvent("tournament-schedule-published", { detail: { tournamentItemId } }));
    } catch (error: any) {
      toast.error("Chưa thể công bố lich", {
        description: error?.response?.data?.message || "Vui lòng thử lại sau.",
      });
      throw error;
    }
  },

  generateGroupStage: async (payload) => {
    try {
      await orgScheduleMgmtService.generateGroupStageMatches(payload);
      const data = await orgScheduleMgmtService.getScheduleData(payload.tournamentItemId);
      const matches = applyConflicts(data.matches);
      set({
        stats: buildStats(matches),
        capacity: data.capacity,
        venues: data.venues,
        referees: data.referees,
        stages: data.stages,
        matches,
        needsGroupSetup: data.needsGroupSetup,
        currentTournamentItemId: payload.tournamentItemId,
        selectedStageId: data.stages[0]?.id || null,
        selectedMatchId: null,
      });
      toast.success("Đã sinh trận vòng bảng.");
    } catch (error: any) {
      toast.error(error?.response?.data?.title || "Không thể sinh tran", {
        description: error?.response?.data?.message || "Vui lòng kiểm tra danh sach doi va cấu hình stage.",
      });
    }
  },
}));
