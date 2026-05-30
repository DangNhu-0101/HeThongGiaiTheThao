
import type { Tournament } from "./tournament";
import type {User} from "./user";
import type { Team } from "./Team";
import type { Member } from "./member";
import type { Invitation } from "./invitation";
import type { Organization } from "./org";


export interface AuthState {
    accessToken: string | null;
    user: User | null; // Có thể thay đổi thành kiểu dữ liệu cụ thể hơn nếu có
    loading: boolean;

    clearState: () => void;
    register: (email: string, password: string, username: string, phonenumber: string, role: string, profileData: unknown) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

export interface TournamentState {
  organizations: Organization[];
  tournament: Tournament | null;
  loading: boolean;
  tournamentList: Tournament[];
fetchTournaments: () => Promise<void>;  
fetchOrganizations: () => Promise<void>;
  fetchTournamentById: (id: string) => Promise<void>;
  submitTournament: (mode: "create" | "edit", id: string | null, payload: FormData) => Promise<boolean>;
  clearTournament: () => void;
}

export interface RegisterFlowData {
    tournamentId: string;
    sport: string;
    categoryId?: string;
    regMode: 'solo' | 'create' | 'random';
    teamName?: string;
    invitedUserIds?: string[];
}


export interface TeamState{
    currentTeam: Team | null;
    userTeams: Team[]; // danh sách đội của user
    tournamentTeams: Team[]; // đội theo giải
    members: Member[]; // thành viên của đội hiện tại
    invitations: Invitation[]; // lời mời của user
    joinRequests: unknown[]; // yêu cầu vào đội (captain view)
    loading: boolean;
    error: string | null


    createTeam: (data: { name: string; tournamentId: string; sportCategory?: string; logo?: string }) => Promise<void>;
    updateTeam: (teamId: string, data: Partial<Team>) => Promise<void>;
    deleteTeam: (teamId: string) => Promise<void>;
    getUserTeams: () => Promise<void>;
    getTeamDetail: (teamId: string) => Promise<void>;
    getTeamsByTournament: (tournamentId: string, status?: string) => Promise<void>;
    leaveTeam: (teamId: string) => Promise<void>;
    kickMember: (teamId: string, memberId: string) => Promise<void>;
    transferCaptaincy: (teamId: string, newCaptainUserId: string) => Promise<void>;
    sendInvitation: (teamId: string, receiverUserId: string, message?: string) => Promise<void>;
    acceptInvitation: (invitationId: string) => Promise<void>;
    rejectInvitation: (invitationId: string) => Promise<void>;
    getUserInvitations: () => Promise<void>;
    requestToJoinTeam: (teamId: string) => Promise<void>;
    getTeamJoinRequests: (teamId: string) => Promise<void>;
    approveJoinRequest: (requestId: string) => Promise<void>;
    rejectJoinRequest: (requestId: string) => Promise<void>;
    updatePaymentStatus: (teamId: string, isPaid: boolean) => Promise<void>;
    searchUsers: (keyword: string) => Promise<unknown[]>;
    registerFlow: (data: RegisterFlowData) => Promise<{ teamId: string; teamName: string; fee: number }>;
    clearCurrentTeam: () => void;
    clearError: () => void;
}

