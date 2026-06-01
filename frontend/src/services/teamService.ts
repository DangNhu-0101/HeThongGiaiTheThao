// src/services/teamService.ts
import api from "../libs/axios";
import {toast} from "sonner";


export const teamService = {
    // 1. Tạo đội
    createTeam: async (data: { name: string; tournamentId: string; sportCategory?: string; logo?: string }) => {
        try {
            const res = await api.post("/teams", data);
            return res.data;
        } catch (err) {
            toast.error("Tạo đội thất bại");
            console.log(err);
       
        }
    },


    // 2. Cập nhật đội
    updateTeam: async (teamId: string, data: Partial<{ name: string; logo: string; sportCategory: string; status: string }>) => {
        try {
            const res = await api.put(`/teams/${teamId}`, data);
            return res.data;
        } catch (err) {
            toast.error("Cập nhật đội thất bại");
            console.log(err);
       
        }
    },


    // 3. Xóa (vô hiệu hóa) đội
    deleteTeam: async (teamId: string) => {
        try {
            const res = await api.delete(`/teams/${teamId}`);
            return res.data;
        } catch (err) {
            toast.error("Xóa đội thất bại");
            console.log(err);
      
        }
    },


    // 4. Lấy danh sách đội của user hiện tại
    getUserTeams: async () => {
        try {
            const res = await api.get("/teams/user");
            return res.data;
        } catch (err) {
            toast.error("Lấy danh sách đội thất bại");
            console.log(err);
         
        }
    },


    // 5. Chi tiết đội (kèm thành viên)
    getTeamDetail: async (teamId: string) => {
        try {
            const res = await api.get(`/teams/${teamId}`);
            return res.data;
        } catch (err) {
            toast.error("Lấy chi tiết đội thất bại");
            console.log(err);
     
        }
    },


    // 6. Danh sách đội theo giải đấu (có thể lọc theo status)
    getTeamsByTournament: async (tournamentId: string, status?: string) => {
        try {
            const res = await api.get(`/teams/tournaments/${tournamentId}/teams`, { params: { status } });
            return res.data;
        } catch (err) {
            toast.error("Lấy danh sách đội theo giải thất bại");
            console.log(err);
        
        }
    },


    // 7. Rời đội
    leaveTeam: async (teamId: string) => {
        try {
            const res = await api.post(`/teams/${teamId}/leave`);
            return res.data;
        } catch (err) {
            toast.error("Rời đội thất bại");
            console.log(err);
           
        }
          
    },


    // 8. Captain xóa thành viên
    kickMember: async (teamId: string, memberId: string) => {
        try {
            const res = await api.delete(`/teams/${teamId}/members/${memberId}`);
            return res.data;
        } catch (err) {
            toast.error("Xóa thành viên thất bại");
            console.log(err);
            
        }
    },


    // 9. Chuyển quyền đội trưởng
    transferCaptaincy: async (teamId: string, newCaptainUserId: string) => {
        try {
            const res = await api.post("/teams/transfer-captaincy", { teamId, newCaptainUserId });
            return res.data;
        } catch (err) {
            toast.error("Chuyển quyền đội trưởng thất bại");
            console.log(err);
           
        }
    },


    // 10. Gửi lời mời (captain)
    sendInvitation: async (teamId: string, receiverUserId: string, message?: string) => {
        try {
            const res = await api.post("/teams/invitations", { teamId, receiverUserId, message });
            return res.data;
        } catch (err) {
            toast.error("Gửi lời mời thất bại");
            console.log(err);
           
        }
    },


    // 11. Chấp nhận lời mời
    acceptInvitation: async (invitationId: string) => {
        try {
            const res = await api.put(`/invitations/${invitationId}/accept`);
            return res.data;
        } catch (err) {
            toast.error("Chấp nhận lời mời thất bại");
            console.log(err);
           
        }
    },


    // 12. Từ chối lời mời
    rejectInvitation: async (invitationId: string) => {
        try {
            const res = await api.put(`/invitations/${invitationId}/reject`);
            return res.data;
        } catch (err) {
            console.log(err);
            toast.error("Từ chối lời mời thất bại");
        }

    },


    // 13. Lấy danh sách lời mời của user hiện tại
    getUserInvitations: async () => {
        try {
            const res = await api.get("/invitations/user");
            return res.data;
        } catch (err) {
            console.log(err);
            toast.error("Lấy danh sách lời mời thất bại");

        }
    },


    // 14. Cầu thủ tự gửi yêu cầu tham gia đội
    requestToJoinTeam: async (teamId: string) => {
        try {
            const res = await api.post("/teams/join-requests", { teamId });
            return res.data;
        } catch (err) {
            console.log(err);
            toast.error("Gửi yêu cầu tham gia đội thất bại");

        }
    },


    // 15. Captain duyệt yêu cầu tham gia
    approveJoinRequest: async (requestId: string) => {
        try {
            const res = await api.put(`/join-requests/${requestId}/approve`);
            return res.data;
        } catch (err) {
            console.log(err);
            toast.error("Duyệt yêu cầu thất bại");

        }
    },


    // 16. Captain từ chối yêu cầu
    rejectJoinRequest: async (requestId: string) => {
        try {
            const res = await api.put(`/join-requests/${requestId}/reject`);
            return res.data;
        } catch (err) {
            console.log(err);
            toast.error("Từ chối yêu cầu thất bại");
            return null;
        }
    },


    // 17. Lấy danh sách yêu cầu của đội (captain)
    getTeamJoinRequests: async (teamId: string) => {
        try {
            const res = await api.get(`/teams/${teamId}/join-requests`);
            return res.data;
        } catch (err) {
            console.log(err);
            toast.error("Lấy danh sách yêu cầu thất bại");
 
        }
    },


    // 18. Cập nhật trạng thái thanh toán
    updatePaymentStatus: async (teamId: string, isPaid: boolean) => {
        try {
            const res = await api.put(`/teams/${teamId}/payment`, { isPaid });
            return res.data;
        } catch (err) {
            console.log(err);
            toast.error("Cập nhật thanh toán thất bại");

        }
    },


    // 19. Tìm kiếm người chơi (để mời)
    searchUsers: async (keyword: string) => {
        try {
            const res = await api.get("/users/search", { params: { keyword } });
            return res.data;
        } catch (err) {
            console.log(err);
            toast.error("Tìm kiếm người dùng thất bại");

        }
    },


    // 20. Đăng ký flow (tạo đội + mời)
    registerFlow: async (data: {
        tournamentId: string;
        sport: string;
        categoryId?: string;
        regMode: "solo" | "create" | "random";
        teamName?: string;
        invitedUserIds?: string[];
    }) => {
        try {
            const res = await api.post("/teams/register-flow", data);
            return res.data;
        } catch (err) {
            console.log(err);
            toast.error("Đăng ký giải đấu thất bại");

        }
    },


    // 21. Ghép đội tự động (merge team)
    mergeTeam: async (baseRuleId: string) => {
        try {
            const res = await api.post(`/teams/merge/${baseRuleId}`);
            return res.data;
        } catch (err) {
            console.log(err);
            toast.error("Ghép đội thất bại");
            
        }
    },
};

