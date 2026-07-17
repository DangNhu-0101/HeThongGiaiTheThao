import { create } from "zustand";
import { competitionFormatService } from "@/services/competitionFormatService";
import type { CompetitionFormatStoreState } from "@/types/store";

type FormatSyncConfirmError = {
  response?: {
    data?: {
      code?: string;
      data?: {
        lockedMatchCount?: number;
        resultCount?: number;
      };
    };
  };
};

export const useCompetitionFormatStore = create<CompetitionFormatStoreState>((set, get) => ({
  formats: [],
  tournamentOptions: [],
  selectedTournamentItemId: null,
  selectedId: null,
  loading: false,
  saving: false,

  fetchFormats: async () => {
    set({ loading: true });
    try {
      const formats = await competitionFormatService.getFormats();
      set((state) => ({
        formats: [
          ...state.formats.filter((item) => item.sourceKind === "local" || item.tournamentItemId),
          ...formats.filter((item) => !state.formats.some((current) => current.id === item.id && (current.sourceKind === "local" || current.tournamentItemId))),
        ],
        selectedId: state.selectedId ?? formats[0]?.id ?? null,
      }));
    } catch (error) {
      console.error("Lỗi khi tải thể thức thi đấu:", error);
    } finally {
      set({ loading: false });
    }
  },

  fetchTournamentOptions: async () => {
    set({ loading: true });
    try {
      const tournamentOptions = await competitionFormatService.getTournamentOptions();
      set({ tournamentOptions });
      const selectedId = get().selectedTournamentItemId;
      if (selectedId) await get().selectTournamentItem(selectedId);
    } catch (error) {
      console.error("Lỗi khi tải danh sách giải đấu:", error);
    } finally {
      set({ loading: false });
    }
  },

  selectTournamentItem: async (id) => {
    set({ loading: true, selectedTournamentItemId: id, selectedId: id });
    try {
      const option = get().tournamentOptions.find((item) => item.id === id);
      const format = await competitionFormatService.getTournamentFormat(id, option);
      set((state) => ({
        formats: [format, ...state.formats.filter((item) => item.id !== id)],
        selectedId: id,
      }));
    } finally {
      set({ loading: false });
    }
  },

  saveTournamentFormat: async (payload) => {
    const tournamentItemId = payload.tournamentItemId || get().selectedTournamentItemId;
    if (!tournamentItemId) throw new Error("Chưa chọn giải đấu");
    set({ saving: true });
    try {
      try {
        await competitionFormatService.saveTournamentFormat(tournamentItemId, payload);
      } catch (error) {
        const apiError = error as FormatSyncConfirmError;
        if (apiError.response?.data?.code !== "FORMAT_SYNC_CONFIRM_REQUIRED") throw error;
        const lockedMatchCount = apiError.response.data.data?.lockedMatchCount || 0;
        const resultCount = apiError.response.data.data?.resultCount || 0;
        const accepted = window.confirm(
          `Cấu hình mới ảnh hưởng tới ${lockedMatchCount} trận đã có lịch/trạng thái hoặc ${resultCount} kết quả. Bạn có muốn đồng bộ lại các trận liên quan theo cấu hình mới không?`,
        );
        if (!accepted) throw error;
        await competitionFormatService.saveTournamentFormat(tournamentItemId, {
          ...payload,
          allowLockedSync: true,
        });
      }
      await get().selectTournamentItem(tournamentItemId);
    } finally {
      set({ saving: false });
    }
  },

  selectFormat: (id) => set({ selectedId: id }),

  createFormat: async (payload) => {
    set({ saving: true });
    try {
      await competitionFormatService.createFormat(payload);
      await get().fetchFormats();
    } finally {
      set({ saving: false });
    }
  },

  updateFormat: async (id, payload) => {
    set({ saving: true });
    try {
      await competitionFormatService.updateFormat(id, payload);
      await get().fetchFormats();
      set({ selectedId: id });
    } finally {
      set({ saving: false });
    }
  },

  deleteFormat: async (id) => {
    set({ saving: true });
    try {
      await competitionFormatService.deleteFormat(id);
      await get().fetchFormats();
    } finally {
      set({ saving: false });
    }
  },
}));
