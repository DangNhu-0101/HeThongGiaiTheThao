import { create } from "zustand";
import { toast } from "sonner";
import { teamCollaborationService } from "@/services/teamCollaborationService";
import type {
  MemberFee,
  PlayerProfileSummary,
  TeamInvitation,
  TeamJoinRequest,
  TeamNotification,
} from "@/types/teamCollaboration";

interface State {
  players: PlayerProfileSummary[];
  invitations: TeamInvitation[];
  sentInvitations: TeamInvitation[];
  joinRequests: TeamJoinRequest[];
  sentJoinRequests: TeamJoinRequest[];
  notifications: TeamNotification[];
  fees: MemberFee[];
  loading: boolean;
  reviewingRequestIds: Record<string, boolean>;
  searchPlayers: (tournamentId: string, keyword: string) => Promise<void>;
  fetchInvitations: (teamId: string) => Promise<void>;
  fetchMyInvitations: () => Promise<void>;
  fetchSentInvitations: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  fetchJoinRequests: (teamId: string) => Promise<void>;
  fetchMyJoinRequests: () => Promise<void>;
  fetchFees: (teamId: string) => Promise<void>;
  invitePlayer: (teamId: string, tournamentId: string, player: PlayerProfileSummary) => Promise<void>;
  acceptInvitation: (id: string) => Promise<void>;
  rejectInvitation: (id: string) => Promise<void>;
  cancelInvitation: (id: string) => Promise<void>;
  requestJoin: (teamId: string, tournamentId: string, player: PlayerProfileSummary) => Promise<void>;
  cancelJoinRequest: (id: string) => Promise<void>;
  reviewJoinRequest: (id: string, decision: "accept" | "reject") => Promise<void>;
  markRead: (id: string) => void;
  submitFee: (teamId: string, playerId: string, receipt: string) => Promise<void>;
}

export const useTeamCollaborationStore = create<State>((set, get) => ({
  players: [],
  invitations: [],
  sentInvitations: [],
  joinRequests: [],
  sentJoinRequests: [],
  notifications: [],
  fees: [],
  loading: false,
  reviewingRequestIds: {},

  searchPlayers: async (tournamentId, keyword) => {
    set({ loading: true });
    try {
      const players = await teamCollaborationService.searchPlayers(tournamentId, keyword);
      set({ players });
    } catch (error) {
      console.error("Không thể tìm vận động viên:", error);

      set({ players: [] });
    } finally {
      set({ loading: false });
    }
  },

  fetchInvitations: async (teamId) => {
    try {
      const invitations = await teamCollaborationService.getInvitations(teamId);
      set({ invitations });
    } catch (error) {
      console.error("Không thể tải lời mời:", error);
      set({ invitations: [] });
    }
  },

  fetchMyInvitations: async () => {
    try {
      const invitations = await teamCollaborationService.getMyInvitations();
      set({ invitations });
    } catch (error) {
      console.error("Không thể tải lời mời nhận được:", error);
      set({ invitations: [] });
    }
  },

  fetchSentInvitations: async () => {
    try {
      const sentInvitations = await teamCollaborationService.getSentInvitations();
      set({ sentInvitations });
    } catch (error) {
      console.error("Không thể tải lời mời đã gửi:", error);
      set({ sentInvitations: [] });
    }
  },

  fetchNotifications: async () => {
    try {
      const [invitations, sentJoinRequests] = await Promise.all([
        teamCollaborationService.getMyInvitations(),
        teamCollaborationService.getMyJoinRequests(),
      ]);
      const notifications: TeamNotification[] = [
        ...invitations.map((item) => ({
          id: `invitation-${item.id}`,
          type: "team_invitation" as const,
          title: `${item.teamName} đã mời bạn`,
          message: item.message || `Bạn nhận được lời mời tham gia đội ${item.teamName}.`,
          href: `/teams/${item.teamId}`,
          read: item.status !== "pending",
          createdAt: item.createdAt,
          actionId: item.id,
          actionKind: "invitation" as const,
        })),
        ...sentJoinRequests.map((item) => ({
          id: `join-request-${item.id}`,
          type: "request_result" as const,
          title: item.status === "accepted" ? "Yêu cầu gia nhập đã được chấp nhận" : item.status === "rejected" ? "Yêu cầu gia nhập đã bị từ chối" : "Yêu cầu gia nhập đã gửi",
          message: item.status === "pending"
            ? `Bạn đã đăng ký gia nhập ${item.player.teamName || "đội"} thành công, đang chờ đội trưởng duyệt.`
            : `Trạng thái yêu cầu của bạn: ${item.status}.`,
          href: item.teamId ? `/teams/${item.teamId}` : undefined,
          read: item.status === "pending",
          createdAt: item.createdAt,
        })),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      set({ notifications, invitations, sentJoinRequests });
    } catch (error) {
      console.error("Không thể tải thông báo:", error);
    }
  },

  fetchJoinRequests: async (teamId) => {
    try {
      const joinRequests = await teamCollaborationService.getJoinRequests(teamId);
      set({ joinRequests });
    } catch (error) {
      console.error("Không thể tải yêu cầu gia nhập:", error);
      set({ joinRequests: [] });
    }
  },

  fetchMyJoinRequests: async () => {
    try {
      const sentJoinRequests = await teamCollaborationService.getMyJoinRequests();
      set({ sentJoinRequests });
    } catch (error) {
      console.error("Không thể tải yêu cầu đã gửi:", error);
      set({ sentJoinRequests: [] });
    }
  },

  fetchFees: async (teamId) => {
    try {
      const fees = await teamCollaborationService.getMemberFees(teamId);
      set({ fees });
    } catch (error) {
      console.error("Không thể tải lệ phí đội:", error);
      set({ fees: [] });
    }
  },

  invitePlayer: async (teamId, tournamentId, player) => {
    try {
      const invitation = await teamCollaborationService.invite(teamId, player.userId, "Mời bạn tham gia đội");
      set((state) => ({
        sentInvitations: [invitation, ...state.sentInvitations],
        invitations: [invitation, ...state.invitations],
        notifications: [{
          id: `sent-invitation-${invitation.id}`,
          type: "team_invitation",
          title: `Đã mời ${player.name}`,
          message: `${player.name} đã nhận được lời mời tham gia đội.`,
          href: `/teams/${teamId}`,
          read: false,
          createdAt: new Date().toISOString(),
        }, ...state.notifications],
      }));
      toast.success(`Đã mời ${player.name}`);
    } catch (error) {
      console.error("Không thể gửi lời mời:", error);
      toast.error("Không thể gửi lời mời.");
    }
    void tournamentId;
  },

  acceptInvitation: async (id) => {
    try {
      await teamCollaborationService.acceptInvitation(id);
      set((state) => ({
        invitations: state.invitations.map((item) => item.id === id ? { ...item, status: "accepted" } : item),
        notifications: state.notifications.map((item) => item.actionId === id ? { ...item, read: true, title: "Bạn đã chấp nhận lời mời" } : item),
      }));
      toast.success("Đã chấp nhận lời mời tham gia đội");
    } catch (error) {
      console.error("Không thể chấp nhận lời mời:", error);
      toast.error("Không thể chấp nhận lời mời.");
    }
  },

  rejectInvitation: async (id) => {
    try {
      await teamCollaborationService.rejectInvitation(id);
      set((state) => ({
        invitations: state.invitations.map((item) => item.id === id ? { ...item, status: "rejected" } : item),
        notifications: state.notifications.map((item) => item.actionId === id ? { ...item, read: true, title: "Bạn đã từ chối lời mời" } : item),
      }));
      toast.success("Đã từ chối lời mời");
    } catch (error) {
      console.error("Không thể từ chối lời mời:", error);
      toast.error("Không thể từ chối lời mời.");
    }
  },

  cancelInvitation: async (id) => {
    try {
      await teamCollaborationService.cancelInvitation(id);
      set((state) => ({
        sentInvitations: state.sentInvitations.map((item) => item.id === id ? { ...item, status: "cancelled" } : item),
      }));
      toast.success("Đã thu hồi lời mời");
    } catch (error) {
      console.error("Không thể thu hồi lời mời:", error);
      toast.error("Không thể thu hồi lời mời.");
    }
  },

  requestJoin: async (teamId, tournamentId, player) => {
    try {
      const request = await teamCollaborationService.requestToJoin(teamId, "Tôi muốn gia nhập đội");
      set((state) => ({
        sentJoinRequests: [request, ...state.sentJoinRequests],
        notifications: [{
          id: `sent-join-request-${request.id}`,
          type: "join_request",
          title: "Bạn đăng ký gia nhập thành công",
          message: "Yêu cầu của bạn đã được gửi đến đội trưởng và đang chờ duyệt.",
          href: `/teams/${teamId}`,
          read: false,
          createdAt: new Date().toISOString(),
        }, ...state.notifications],
      }));
      toast.success("Đã gửi yêu cầu gia nhập đội");
    } catch (error) {
      console.error("Không thể gửi yêu cầu gia nhập:", error);
      toast.error("Không thể gửi yêu cầu gia nhập đội.");
    }
    void tournamentId;
    void player;
  },

  cancelJoinRequest: async (id) => {
    try {
      await teamCollaborationService.cancelJoinRequest(id);
      set((state) => ({
        sentJoinRequests: state.sentJoinRequests.map((item) => item.id === id ? { ...item, status: "cancelled" } : item),
      }));
      toast.success("Đã rút yêu cầu gia nhập");
    } catch (error) {
      console.error("Không thể rút yêu cầu gia nhập:", error);
      toast.error("Không thể rút yêu cầu gia nhập.");
    }
  },

  reviewJoinRequest: async (id, decision) => {
    if (get().reviewingRequestIds[id]) return;
    set((state) => ({ reviewingRequestIds: { ...state.reviewingRequestIds, [id]: true } }));
    try {
      await teamCollaborationService.reviewJoinRequest(id, decision);
      const request = get().joinRequests.find((item) => item.id === id);
      set((state) => ({
        joinRequests: state.joinRequests.map((item) => item.id === id ? { ...item, status: decision === "accept" ? "accepted" : "rejected" } : item),
        notifications: [{
          id: `review-join-request-${id}`,
          type: "request_result",
          title: decision === "accept" ? "Đã chấp nhận yêu cầu gia nhập" : "Đã từ chối yêu cầu gia nhập",
          message: decision === "accept" ? `${request?.player.name || "Thành viên"} đã được thêm vào đội.` : "Yêu cầu gia nhập đã được cập nhật.",
          href: request?.teamId ? `/teams/${request.teamId}` : undefined,
          read: false,
          createdAt: new Date().toISOString(),
        }, ...state.notifications],
      }));
      toast.success(decision === "accept" ? `Đã chấp nhận ${request?.player.name || "thành viên"}` : "Đã từ chối yêu cầu");
    } catch (error) {
      console.error("Không thể duyệt yêu cầu gia nhập:", error);
      toast.error("Không thể duyệt yêu cầu gia nhập đội.");
    } finally {
      set((state) => {
        const reviewingRequestIds = { ...state.reviewingRequestIds };
        delete reviewingRequestIds[id];
        return { reviewingRequestIds };
      });
    }
  },

  markRead: (id) => set((state) => ({
    notifications: state.notifications.map((item) => item.id === id ? { ...item, read: true } : item),
  })),

  submitFee: async (teamId, playerId, receipt) => {
    try {
      const fee = await teamCollaborationService.submitFee(teamId, playerId, receipt);
      set((state) => ({
        fees: state.fees.map((item) => item.playerId === fee.playerId ? fee : item),
      }));
      toast.success("Đã gửi biên lai lệ phí");
    } catch (error) {
      console.error("Không thể gửi biên lai lệ phí:", error);
      toast.error("Không thể gửi biên lai lệ phí.");
    }
  },
}));
