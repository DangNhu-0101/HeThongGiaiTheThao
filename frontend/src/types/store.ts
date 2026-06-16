import type { BaseRule } from "./baseRule";
import type { Match, Sport, Tournament } from "./tournament";
import type { User, UserProfile } from "./user";

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  loading: boolean;

  clearState: () => void;
  register: (
    email: string,
    password: string,
    username: string,
    phoneNumber: string,
    role: "admin" | "organizer" | "org" | "referee" | "player" | "user",
    profileData: UserProfile,
  ) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export interface TournamentState {
  accessToken: string | null;
  tournament: Tournament | null;
  baseRule: BaseRule | null;
  loading: boolean;
}

export interface HomeState {
  tournaments: Tournament[];
  upcomingMatches: Match[];
  sports: Sport[];
  loading: boolean;

  fetchHomeData: () => Promise<void>;
}
