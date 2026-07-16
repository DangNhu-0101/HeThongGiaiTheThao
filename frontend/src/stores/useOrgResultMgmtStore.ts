import { create } from "zustand";
import { toast } from "sonner";
import { orgResultMgmtService } from "@/services/orgResultMgmtService";
import type { MatchStatusTag, ResultMatchRecord, ResultStageOption, ResultStat } from "@/types/orgResultMgmt";

type ApiStoreError = Error & {
  response?: {
    status?: number;
    data?: {
      title?: string;
      message?: string;
      sync?: unknown;
    };
  };
};

export interface OrgResultMgmtState {
  stats: ResultStat[];
  matches: ResultMatchRecord[];
  stages: ResultStageOption[];
  statusTags: MatchStatusTag[];
  selectedMatchId: string | null;
  currentTournamentItemId: string | null;
  loading: boolean;
  savingMatchIds: string[];
  error: string | null;
  fetchData: (tournamentItemId?: string, silent?: boolean) => Promise<void>;
  setSelectedMatchId: (id: string | null) => void;
  updateScore: (matchId: string, team: "teamA" | "teamB", delta: number) => void;
  saveLiveScore: (matchId: string) => Promise<void>;
  confirmResult: (matchId: string) => Promise<void>;
  updateStatus: (matchId: string, status: string) => Promise<void>;
  publishStageStandings: (stageId: string) => Promise<void>;
}

export const useOrgResultMgmtStore = create<OrgResultMgmtState>((set, get) => ({
  stats: [],
  matches: [],
  stages: [],
  statusTags: [],
  selectedMatchId: null,
  currentTournamentItemId: null,
  loading: false,
  savingMatchIds: [],
  error: null,

  fetchData: async (tournamentItemId, silent = false) => {
    if (!silent) set({ loading: true, error: null });
    try {
      const data = await orgResultMgmtService.getResultData(tournamentItemId);
      set({ stats: data.stats, matches: data.matches, stages: data.stages, statusTags: data.statusTags, currentTournamentItemId: tournamentItemId || null, error: null });
    } catch (error) {
      console.error("Lỗi tải dữ liệu kết quả:", error);
      set({ stats: [], matches: [], stages: [], statusTags: [], error: "Không thể tải dữ liệu kết quả. Vui lòng thử lại sau." });
    } finally {
      if (!silent) set({ loading: false });
    }
  },

  setSelectedMatchId: (id) => set({ selectedMatchId: id }),

  updateScore: (matchId, team, delta) => set((state) => ({
    matches: state.matches.map((match) => {
      if (match.id !== matchId) return match;
      if (match.status !== "live") {
        toast.error(match.status === "completed" ? "Trận đã hoàn thành" : "Chưa thể nhập điểm", {
          description: match.status === "completed"
            ? "Trận đã hoàn thành nên không thể sửa điểm tại màn hình này."
            : "Chỉ có trận đang diễn ra mới được phép nhập điểm.",
        });
        return match;
      }
      return { ...match, [team]: { ...match[team], score: Math.max(0, match[team].score + delta) } };
    }),
  })),

  saveLiveScore: async (matchId) => {
    const match = get().matches.find((item) => item.id === matchId);
    if (!match) return;
    if (match.status !== "live") {
      toast.error(match.status === "completed" ? "Trận đã hoàn thành" : "Chưa thể lưu điểm", {
        description: match.status === "completed"
          ? "Trận đã hoàn thành nên không thể sửa điểm."
          : "Chỉ có trận đang diễn ra mới được phép lưu điểm.",
      });
      return;
    }
    set((state) => ({ savingMatchIds: [...new Set([...state.savingMatchIds, matchId])] }));
    try {
      await orgResultMgmtService.saveLiveScore(match);
      toast.success("Đã lưu điểm đang diễn ra.");
      const tournamentItemId = get().currentTournamentItemId;
      if (tournamentItemId) await get().fetchData(tournamentItemId, true);
    } catch (error: unknown) {
      const apiError = error as ApiStoreError;
      toast.error(apiError.response?.data?.title || "Chưa thể lưu điểm", {
        description: apiError.response?.data?.message || apiError.message || "Vui lòng thử lại.",
      });
      throw error;
    } finally {
      set((state) => ({ savingMatchIds: state.savingMatchIds.filter((id) => id !== matchId) }));
    }
  },

  confirmResult: async (matchId) => {
    const match = get().matches.find((item) => item.id === matchId);
    if (!match) return;
    if (match.status !== "live") {
      toast.error(match.status === "completed" ? "Trận đã hoàn thành" : "Chưa thể kết thúc trận", {
        description: match.status === "completed"
          ? "Trận đã hoàn thành nên không thể nhập lại kết quả."
          : "Chỉ có trận đang diễn ra mới được phép xác nhận kết quả.",
      });
      return;
    }
    set((state) => ({ savingMatchIds: [...new Set([...state.savingMatchIds, matchId])] }));
    try {
      const response = await orgResultMgmtService.confirmMatchResult(match);
      console.info("Đồng bộ kết quả thành công", response?.data?.sync || {});
      toast.success("Đã xác nhận kết quả và đồng bộ BXH.");
      const tournamentItemId = get().currentTournamentItemId;
      if (tournamentItemId) {
        await get().fetchData(tournamentItemId);
        window.dispatchEvent(new CustomEvent("tournament-result-synced", { detail: { tournamentItemId } }));
      }
    } catch (error: unknown) {
      const apiError = error as ApiStoreError;
      console.error("Save final result failed", {
        status: apiError.response?.status,
        data: apiError.response?.data,
        requestPayload: {
          matchId: match.id,
          matchCode: match.matchCode,
          stageId: match.stageId,
          teamAId: match.teamA.id,
          teamBId: match.teamB.id,
          teamAScore: match.teamA.score,
          teamBScore: match.teamB.score,
          winnerId: match.teamA.score >= match.teamB.score ? match.teamA.id : match.teamB.id,
        },
      });
      const title = apiError.response?.data?.title || "Chưa thể cập nhật kết quả";
      const message = apiError.response?.data?.message || apiError.message || "Vui lòng kiểm tra thể thức, điểm số và trạng thái công bố BXH rồi thử lại.";
      toast.error(title, { description: message });
    } finally {
      set((state) => ({ savingMatchIds: state.savingMatchIds.filter((id) => id !== matchId) }));
    }
  },

  updateStatus: async (matchId, status) => {
    try {
      await orgResultMgmtService.updateMatchStatus(matchId, status);
      const tournamentItemId = get().currentTournamentItemId;
      if (tournamentItemId) await get().fetchData(tournamentItemId);
    } catch (error: unknown) {
      const apiError = error as ApiStoreError;
      toast.error("Chưa thể đổi trạng thái trận", {
        description: apiError.response?.data?.message || "Vui lòng thử lại sau.",
      });
    }
  },

  publishStageStandings: async (stageId) => {
    try {
      await orgResultMgmtService.publishStageStandings(stageId);
      toast.success("Đã công bố BXH cho stage.");
      const tournamentItemId = get().currentTournamentItemId;
      if (tournamentItemId) await get().fetchData(tournamentItemId);
    } catch (error: unknown) {
      const apiError = error as ApiStoreError;
      toast.error("Chưa thể công bố BXH", {
        description: apiError.response?.data?.message || "Vui lòng thử lại sau.",
      });
    }
  },
}));
