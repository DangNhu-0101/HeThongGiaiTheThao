import { create } from "zustand";
import type { TournamentState } from "@/types/store";

import { tournamentService } from "../services/tournamentService";
import { toast } from "sonner";




export const useTournamentStore = create<TournamentState>((set, get) => ({
  organizations: [],
  tournaments: null,
  tournamentList: [],
  loading: false,

  // Implementation of missing interface method
  getAllTournaments: async () => {
    await get().fetchTournaments();
  },

  fetchTournaments: async () => {
    try {
      set({ loading: true });
      const data = await tournamentService.getAll();
      set({ tournamentList: data });
    } catch (error) {
      console.error("Lỗi xảy ra khi fetchTournaments", error);
      toast.error("Không thể tải danh sách giải đấu!");
      set({ tournamentList: [] });
    } finally {
      set({ loading: false });
    }
  },

  fetchOrganizations: async () => {
    try {
      set({ loading: true });

      const orgs = await tournamentService.getOrganizations();
      
      set({ organizations: orgs });
    } catch (error) {
      console.error("Lỗi xảy ra khi fetchOrganizations", error);
      set({ organizations: [] });
    } finally {
      set({ loading: false });
    }
  },

  fetchTournamentById: async (id) => {
    try {
      set({ loading: true });

      const data = await tournamentService.getById(id);
      
      set({ tournaments: data });
    } catch (error) {
      console.error("Lỗi xảy ra khi fetchTournamentById", error);
      toast.error("Không thể tải thông tin giải đấu!");
    } finally {
      set({ loading: false });
    }
  },

  submitTournament: async (mode, id, payload) => {
    try {
      set({ loading: true });

      if (mode === "create") {
        await tournamentService.create(payload);
        toast.success("Khởi tạo giải đấu thành công! 🏆");
      } else {
        if (!id) throw new Error("Thiếu ID giải đấu khi cập nhật");
        await tournamentService.update(id, payload);
        toast.success("Cập nhật thông tin giải đấu thành công! 🔧");
      }

      return true;
    } catch (error) {
      console.error("Lỗi xảy ra khi submitTournament", error);

      const axiosError = error as { response?: { data?: { message?: string } } };
      const errMsg = axiosError.response?.data?.message || (error instanceof Error ? error.message : "Xử lý thông tin giải đấu thất bại. Hãy thử lại");

      toast.error(errMsg);
      return false;
    } finally {
      set({ loading: false });
    }
  },

  clearTournament: () => {
    set({ tournaments: null });
  },
}));