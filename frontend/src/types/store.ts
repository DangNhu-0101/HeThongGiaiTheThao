import type { BaseRule } from "./baseRule";
import type { Match, Sport, Tournament } from "./tournament";
import type { CompetitionFormatRecord, CompetitionFormatUpsertPayload, CompetitionTournamentOption } from "./competitionFormat";
import type { TournamentMgmtStat, TournamentRecord, TournamentUpsertPayload } from "./orgTournamentMgmt";
import type {
  LoginRequest,
  ProfileRole,
  RegisterRequest,
  RoleProfilePayload,
} from "./auth";
import type { User } from "./user";

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  clearSession: () => void;
  restoreSession: () => Promise<void>;
  register: (payload: RegisterRequest) => Promise<User>;
  login: (payload: LoginRequest) => Promise<User>;
  refreshCurrentUser: () => Promise<User | null>;
  setCurrentUser: (user: User) => void;
  registerRoleProfile: (role: ProfileRole, payload: RoleProfilePayload) => Promise<void>;
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
  stats: {
    totalTournaments: number;
    openRegistrationTournaments: number;
    ongoingTournaments: number;
    totalTeams: number;
    totalSports: number;
    totalAthletesOrRegistrations: number;
    totalMatches: number;
    upcomingMatches: number;
    completedMatches: number;
    collectedAmount: number;
  };
  loading: boolean;
  error: string | null;
  fetchHomeData: () => Promise<void>;
}

export interface OrgTournamentMgmtStoreState {
  stats: TournamentMgmtStat[];
  records: TournamentRecord[];
  loading: boolean;
  saving: boolean;
  fetchData: () => Promise<void>;
  createTournament: (payload: TournamentUpsertPayload) => Promise<void>;
  updateTournament: (id: string, payload: TournamentUpsertPayload) => Promise<void>;
  deleteTournament: (id: string, kind: TournamentUpsertPayload["kind"]) => Promise<void>;
}

export interface CompetitionFormatStoreState {
  formats: CompetitionFormatRecord[];
  tournamentOptions: CompetitionTournamentOption[];
  selectedTournamentItemId: string | null;
  selectedId: string | null;
  loading: boolean;
  saving: boolean;
  fetchFormats: () => Promise<void>;
  fetchTournamentOptions: () => Promise<void>;
  selectTournamentItem: (id: string) => Promise<void>;
  saveTournamentFormat: (payload: CompetitionFormatUpsertPayload) => Promise<void>;
  selectFormat: (id: string) => void;
  createFormat: (payload: CompetitionFormatUpsertPayload) => Promise<void>;
  updateFormat: (id: string, payload: CompetitionFormatUpsertPayload) => Promise<void>;
  deleteFormat: (id: string) => Promise<void>;
}
