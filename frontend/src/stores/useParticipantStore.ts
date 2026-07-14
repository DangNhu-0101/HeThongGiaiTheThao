import { create } from "zustand";
import { getApiErrorMessage } from "@/libs/axios";
import { participantService } from "@/services/participantService";
import type { CreateParticipantPayload, Participant } from "@/types/participant";

interface ParticipantState {
  participants: Participant[];
  loading: boolean;
  error: string | null;
  createParticipant: (payload: CreateParticipantPayload) => Promise<Participant>;
  fetchParticipants: (tournamentItemId: string) => Promise<void>;
  fetchMyParticipants: () => Promise<Participant[]>;
}

export const useParticipantStore = create<ParticipantState>((set) => ({
  participants: [],
  loading: false,
  error: null,

  createParticipant: async (payload) => {
    set({ loading: true, error: null });
    try {
      const participant = await participantService.create(payload);
      set((state) => ({ participants: [participant, ...state.participants] }));
      return participant;
    } catch (error) {
      set({ error: getApiErrorMessage(error, "Không thể đăng ký tham gia giải") });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchParticipants: async (tournamentItemId) => {
    set({ loading: true, error: null });
    try {
      set({ participants: await participantService.getByTournament(tournamentItemId) });
    } catch (error) {
      set({ error: getApiErrorMessage(error, "Không thể tải danh sách đăng ký") });
    } finally {
      set({ loading: false });
    }
  },

  fetchMyParticipants: async () => {
    set({ loading: true, error: null });
    try {
      const participants = await participantService.getMyParticipants();
      set({ participants });
      return participants;
    } catch (error) {
      set({ error: getApiErrorMessage(error, "Không thể tải danh sách đội của tôi") });
      return [];
    } finally {
      set({ loading: false });
    }
  },
}));
