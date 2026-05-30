// stores/useTeamStore.ts
import { create } from "zustand";
import { toast } from "sonner";
import type { TeamState, RegisterFlowData } from "../types/store";
import { teamService } from "@/services/teamService";


export const useTeamStore = create<TeamState>((set, get) => ({
    currentTeam: null,
    userTeams: [],
    tournamentTeams: [],
    members: [],
    invitations: [],
    joinRequests: [],
    loading: false,
    error: null,


    createTeam: async (data) => {
        set({ loading: true, error: null });
        try {
            await teamService.createTeam(data);
            toast.success("Tạo đội thành công");
            await get().getUserTeams();
        } catch (err: any) {
            const msg = err.message || "Tạo đội thất bại";
            set({ error: msg });
            toast.error(msg);
        } finally {
            set({ loading: false });
        }
    },


    updateTeam: async (teamId, data) => {
        set({ loading: true, error: null });
        try {
            await teamService.updateTeam(teamId, data);
            toast.success("Cập nhật đội thành công");
            if (get().currentTeam?.id === teamId) {
                set({ currentTeam: { ...get().currentTeam, ...data } });
            }
            await get().getUserTeams();
        } catch (err: any) {
            const msg = err.message || "Cập nhật đội thất bại";
            set({ error: msg });
            toast.error(msg);
        } finally {
            set({ loading: false });
        }
    },


    deleteTeam: async (teamId) => {
        set({ loading: true, error: null });
        try {
            await teamService.deleteTeam(teamId);
            toast.success("Xóa đội thành công");
            if (get().currentTeam?.id === teamId) set({ currentTeam: null });
            await get().getUserTeams();
        } catch (err: any) {
            const msg = err.message || "Xóa đội thất bại";
            set({ error: msg });
            toast.error(msg);
        } finally {
            set({ loading: false });
        }
    },


    getUserTeams: async () => {
        set({ loading: true, error: null });
        try {
            const res = await teamService.getUserTeams();
            const teams = res?.data || res || [];
            set({ userTeams: teams });
        } catch (err: any) {
            const msg = err.message || "Lấy danh sách đội thất bại";
            set({ error: msg });
            toast.error(msg);
        } finally {
            set({ loading: false });
        }
    },


    getTeamDetail: async (teamId) => {
        set({ loading: true, error: null });
        try {
            const res = await teamService.getTeamDetail(teamId);
            const data = res?.data || res;
            set({
                currentTeam: data,
                members: data?.members || [],
            });
        } catch (err: any) {
            const msg = err.message || "Lấy chi tiết đội thất bại";
            set({ error: msg });
            toast.error(msg);
        } finally {
            set({ loading: false });
        }
    },


    getTeamsByTournament: async (tournamentId, status) => {
        set({ loading: true, error: null });
        try {
            const res = await teamService.getTeamsByTournament(tournamentId, status);
            const teams = res?.data || res || [];
            set({ tournamentTeams: teams });
        } catch (err: any) {
            const msg = err.message || "Lấy danh sách đội theo giải thất bại";
            set({ error: msg });
            toast.error(msg);
        } finally {
            set({ loading: false });
        }
    },


    leaveTeam: async (teamId) => {
        set({ loading: true, error: null });
        try {
            await teamService.leaveTeam(teamId);
            toast.success("Rời đội thành công");
            if (get().currentTeam?.id === teamId) set({ currentTeam: null });
            await get().getUserTeams();
        } catch (err: any) {
            const msg = err.message || "Rời đội thất bại";
            set({ error: msg });
            toast.error(msg);
        } finally {
            set({ loading: false });
        }
    },


    kickMember: async (teamId, memberId) => {
        set({ loading: true, error: null });
        try {
            await teamService.kickMember(teamId, memberId);
            toast.success("Xóa thành viên thành công");
            await get().getTeamDetail(teamId);
        } catch (err: any) {
            const msg = err.message || "Xóa thành viên thất bại";
            set({ error: msg });
            toast.error(msg);
        } finally {
            set({ loading: false });
        }
    },


    transferCaptaincy: async (teamId, newCaptainUserId) => {
        set({ loading: true, error: null });
        try {
            await teamService.transferCaptaincy(teamId, newCaptainUserId);
            toast.success("Chuyển quyền đội trưởng thành công");
            await get().getTeamDetail(teamId);
        } catch (err: any) {
            const msg = err.message || "Chuyển quyền đội trưởng thất bại";
            set({ error: msg });
            toast.error(msg);
        } finally {
            set({ loading: false });
        }
    },


    sendInvitation: async (teamId, receiverUserId, message) => {
        set({ loading: true, error: null });
        try {
            await teamService.sendInvitation(teamId, receiverUserId, message);
            toast.success("Gửi lời mời thành công");
        } catch (err: any) {
            const msg = err.message || "Gửi lời mời thất bại";
            set({ error: msg });
            toast.error(msg);
        } finally {
            set({ loading: false });
        }
    },


    acceptInvitation: async (invitationId) => {
        set({ loading: true, error: null });
        try {
            await teamService.acceptInvitation(invitationId);
            toast.success("Đã chấp nhận lời mời");
            await get().getUserInvitations();
            await get().getUserTeams();
        } catch (err: any) {
            const msg = err.message || "Chấp nhận lời mời thất bại";
            set({ error: msg });
            toast.error(msg);
        } finally {
            set({ loading: false });
        }
    },


    rejectInvitation: async (invitationId) => {
        set({ loading: true, error: null });
        try {
            await teamService.rejectInvitation(invitationId);
            toast.success("Đã từ chối lời mời");
            await get().getUserInvitations();
        } catch (err: any) {
            const msg = err.message || "Từ chối lời mời thất bại";
            set({ error: msg });
            toast.error(msg);
        } finally {
            set({ loading: false });
        }
    },


    getUserInvitations: async () => {
        set({ loading: true, error: null });
        try {
            const res = await teamService.getUserInvitations();
            const invites = res?.data || res || [];
            set({ invitations: invites });
        } catch (err: any) {
            const msg = err.message || "Lấy danh sách lời mời thất bại";
            set({ error: msg });
            toast.error(msg);
        } finally {
            set({ loading: false });
        }
    },


    requestToJoinTeam: async (teamId) => {
        set({ loading: true, error: null });
        try {
            await teamService.requestToJoinTeam(teamId);
            toast.success("Đã gửi yêu cầu tham gia đội");
        } catch (err: any) {
            const msg = err.message || "Gửi yêu cầu thất bại";
            set({ error: msg });
            toast.error(msg);
        } finally {
            set({ loading: false });
        }
    },


    getTeamJoinRequests: async (teamId) => {
        set({ loading: true, error: null });
        try {
            const res = await teamService.getTeamJoinRequests(teamId);
            const requests = res?.data || res || [];
            set({ joinRequests: requests });
        } catch (err: any) {
            const msg = err.message || "Lấy danh sách yêu cầu thất bại";
            set({ error: msg });
            toast.error(msg);
        } finally {
            set({ loading: false });
        }
    },


    approveJoinRequest: async (requestId) => {
        set({ loading: true, error: null });
        try {
            await teamService.approveJoinRequest(requestId);
            toast.success("Đã duyệt yêu cầu");
            const currentTeamId = get().currentTeam?.id;
            if (currentTeamId) {
                await get().getTeamJoinRequests(currentTeamId);
                await get().getTeamDetail(currentTeamId);
            }
        } catch (err: any) {
            const msg = err.message || "Duyệt yêu cầu thất bại";
            set({ error: msg });
            toast.error(msg);
        } finally {
            set({ loading: false });
        }
    },


    rejectJoinRequest: async (requestId) => {
        set({ loading: true, error: null });
        try {
            await teamService.rejectJoinRequest(requestId);
            toast.success("Đã từ chối yêu cầu");
            const currentTeamId = get().currentTeam?.id;
            if (currentTeamId) {
                await get().getTeamJoinRequests(currentTeamId);
            }
        } catch (err: any) {
            const msg = err.message || "Từ chối yêu cầu thất bại";
            set({ error: msg });
            toast.error(msg);
        } finally {
            set({ loading: false });
        }
    },


    updatePaymentStatus: async (teamId, isPaid) => {
        set({ loading: true, error: null });
        try {
            await teamService.updatePaymentStatus(teamId, isPaid);
            toast.success(`Cập nhật thanh toán thành ${isPaid ? "đã đóng" : "chưa đóng"}`);
            if (get().currentTeam?.id === teamId) {
                set({ currentTeam: { ...get().currentTeam, isPaid } });
            }
        } catch (err: any) {
            const msg = err.message || "Cập nhật thanh toán thất bại";
            set({ error: msg });
            toast.error(msg);
        } finally {
            set({ loading: false });
        }
    },


    searchUsers: async (keyword) => {
        set({ loading: true, error: null });
        try {
            const res = await teamService.searchUsers(keyword);
            const users = res?.data || res || [];
            return users;
        } catch (err: any) {
            const msg = err.message || "Tìm kiếm người dùng thất bại";
            set({ error: msg });
            toast.error(msg);
            return [];
        } finally {
            set({ loading: false });
        }
    },


    registerFlow: async (data) => {
        set({ loading: true, error: null });
        try {
            const res = await teamService.registerFlow(data);
            const result = res?.data || res;
            toast.success("Đăng ký giải đấu thành công");
            return result;
        } catch (err: any) {
            const msg = err.message || "Đăng ký giải đấu thất bại";
            set({ error: msg });
            toast.error(msg);
            throw err;
        } finally {
            set({ loading: false });
        }
    },


    clearCurrentTeam: () => set({ currentTeam: null, members: [] }),


    clearError: () => set({ error: null }),


    // Reset toàn bộ state về giá trị khởi tạo
    clearState: () =>
        set({
            currentTeam: null,
            userTeams: [],
            tournamentTeams: [],
            members: [],
            invitations: [],
            joinRequests: [],
            loading: false,
            error: null,
        }),
}));

