
import type { Tournament } from "./tournament";
import type { Team } from "./Team";
import type { Member } from "./member";
import type { Invitation } from "./invitation";
import type { Notification } from "./notification";
import type { Sponsor } from "./sponsor";
import type { Organization } from "./org";
import type { User } from "./user";
import type { Player } from "./player";
import type { Referee } from "./referee";




export interface TournamentState {
  organizations: Organization[];
  tournaments: Tournament | null;
  loading: boolean;
  tournamentList: Tournament[];
  getAllTournaments: () => Promise<void>;
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

export interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    loading: boolean;
    getMyNotifications: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    clearState: () => void;
}
// models/User.ts


// models/Player.ts


// models/Organization.ts (org)



// Giả sử API trả về { user: User, player?: Player, org?: Organization, referee?: Referee }
// Nhưng chỉ một trong ba profile tồn tại
export interface AuthResponse {
    user: User;
    player?: Player;
    org?: Organization;
    referee?: Referee;
}

export interface SponsorState {
    sponsors: Sponsor[];
    loading: boolean;

    getSponsors: () => Promise<void>;
    clearState: () => void;
}

export interface AuthState {
    accessToken: string | null;
    authUser: AuthResponse|null
// Có thể thay đổi thành kiểu dữ liệu cụ thể hơn nếu có
    loading: boolean;

    clearState: () => void;
    register: (email: string, password: string, username: string, phonenumber: string, role: string, profileData: unknown) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}