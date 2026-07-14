import { create } from "zustand";
import { orgTournamentMgmtService } from "@/services/orgTournamentMgmtService";

const STORAGE_KEY = "org:selectedTournamentId";

export interface MinimalTournament {
  id: string;
  tournamentItemId?: string;
  name: string;
}

export interface OrgContextState {
  tournaments: MinimalTournament[];
  selectedTournamentId: string;
  selectedTournamentItemId: string;
  loading: boolean;
  fetchTournaments: () => Promise<void>;
  setSelectedTournamentId: (id: string) => void;
  clearSelectedTournament: () => void;
}

export const useOrgContextStore = create<OrgContextState>((set, get) => ({
  tournaments: [],
  selectedTournamentId: "",
  selectedTournamentItemId: "",
  loading: false,

  fetchTournaments: async () => {
    set({ loading: true });
    try {
      const { records } = await orgTournamentMgmtService.getMgmtData();
      const tournaments = records.map((item) => ({
        id: item.id,
        tournamentItemId: item.tournamentItemId || item.id,
        name: item.name,
      }));
      const currentId = get().selectedTournamentId || window.localStorage.getItem(STORAGE_KEY) || "";
      const selected =
        tournaments.find((item) => item.id === currentId || item.tournamentItemId === currentId)
        || tournaments[0];
      set({
        tournaments,
        selectedTournamentId: selected?.id || "",
        selectedTournamentItemId: selected?.tournamentItemId || selected?.id || "",
      });
      if (selected) {
        window.localStorage.setItem(STORAGE_KEY, selected.id);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error("Không thể tải danh sách giải cho ngữ cảnh tổ chức.", error);
      set({ tournaments: [], selectedTournamentId: "", selectedTournamentItemId: "" });
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      set({ loading: false });
    }
  },

  setSelectedTournamentId: (id) => {
    const selected = get().tournaments.find((item) => item.id === id);
    if (!selected) {
      get().clearSelectedTournament();
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, selected.id);
    set({
      selectedTournamentId: selected.id,
      selectedTournamentItemId: selected.tournamentItemId || selected.id,
    });
  },

  clearSelectedTournament: () => {
    window.localStorage.removeItem(STORAGE_KEY);
    set({ selectedTournamentId: "", selectedTournamentItemId: "" });
  },
}));
