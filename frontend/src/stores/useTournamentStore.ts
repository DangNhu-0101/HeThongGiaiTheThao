import {create} from "zustand"
import {toast} from "sonner"
import type { TournamentState } from "../types/store"


const useTournamentStore = create<TournamentState>((set,get) => ({
    accessToken: null,
    tournament: null,
    baseRule: null,
    loading: false,
}))