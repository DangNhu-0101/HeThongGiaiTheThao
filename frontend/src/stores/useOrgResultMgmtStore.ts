import { create } from "zustand";
import { toast } from "sonner";
import type { MatchStatusTag, ResultStageOption, ResultStat, ResultMatchRecord } from "@/types/orgResultMgmt";
import { orgResultMgmtService } from "@/services/orgResultMgmtService";

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
      console.error("Lỗi tai dữ liệu kết quả:", error);
      set({ stats: [], matches: [], stages: [], statusTags: [], error: "Không thể tai dữ liệu kết quả. Vui lòng thử lại sau." });
    } finally {
      if (!silent) set({ loading: false });
    }
  },

  setSelectedMatchId: (id) => set({ selectedMatchId: id }),

  updateScore: (matchId, team, delta) => set((state) => ({
    matches: state.matches.map((match) => {
      if (match.id !== matchId) return match;
      if (match.status !== "live") {
        toast.error(match.status === "completed" ? "Trận đã hoan thanh" : "Chưa thể nhap điểm", {
          description: match.status === "completed"
            ? "Trận đã hoan thanh nen khong the sua điểm tai man hinh nay."
            : "Chi co trận dang dien ra moi duoc phep nhap điểm.",
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
      toast.error(match.status === "completed" ? "Trận đã hoan thanh" : "Chưa thể luu điểm", {
        description: match.status === "completed"
          ? "Trận đã hoan thanh nen khong the sua điểm."
          : "Chi co trận dang dien ra moi duoc phep luu điểm.",
      });
      return;
    }
    set((state) => ({ savingMatchIds: [...new Set([...state.savingMatchIds, matchId])] }));
    try {
      await orgResultMgmtService.saveLiveScore(match);
      toast.success("Đã lưu điểm dang dien ra.");
      const tournamentItemId = get().currentTournamentItemId;
      if (tournamentItemId) await get().fetchData(tournamentItemId, true);
    } catch (error: any) {
      toast.error(error?.response?.data?.title || "Chưa thể luu điểm", {
        description: error?.response?.data?.message || error?.message || "Vui lòng thử lại.",
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
      toast.error(match.status === "completed" ? "Trận đã hoan thanh" : "Chưa thể ket thuc tran", {
        description: match.status === "completed"
          ? "Trận đã hoan thanh nen khong the nhap lai kết quả."
          : "Chi co trận dang dien ra moi duoc phep xac nhan kết quả.",
      });
      return;
    }
    set((state) => ({ savingMatchIds: [...new Set([...state.savingMatchIds, matchId])] }));
    try {
      const response = await orgResultMgmtService.confirmMatchResult(match);
      console.info("Dong bo kết quả thành công", response?.data?.sync || {});
      toast.success("Đã xác nhận kết quả va dong bo BXH.");
      const tournamentItemId = get().currentTournamentItemId;
      if (tournamentItemId) {
        await get().fetchData(tournamentItemId);
        window.dispatchEvent(new CustomEvent("tournament-result-synced", { detail: { tournamentItemId } }));
      }
    } catch (error: any) {
      console.error("Save final result failed", {
        status: error?.response?.status,
        data: error?.response?.data,
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
      const title = error?.response?.data?.title || "Chưa thể cập nhật kết quả";
      const message = error?.response?.data?.message || error?.message || "Vui lòng kiểm tra thể thức, điểm so va trạng thái công bố BXH roi thử lại.";
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
    } catch (error: any) {
      toast.error("Chưa thể doi trạng thái tran", {
        description: error?.response?.data?.message || "Vui lòng thử lại sau.",
      });
    }
  },

  publishStageStandings: async (stageId) => {
    try {
      await orgResultMgmtService.publishStageStandings(stageId);
      toast.success("Đã công bố BXH cho stage.");
      const tournamentItemId = get().currentTournamentItemId;
      if (tournamentItemId) await get().fetchData(tournamentItemId);
    } catch (error: any) {
      toast.error("Chưa thể công bố BXH", {
        description: error?.response?.data?.message || "Vui lòng thử lại sau.",
      });
    }
  },
}));
