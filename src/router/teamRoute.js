// routes/teamRoutes.js
import express from 'express';
import {
    createTeam,
    updateTeam,
    deleteTeam,
    getUserTeams,
    getTeamDetail,
    getTeamsByTournament,
    leaveTeam,
    kickMember,
    transferCaptaincy,
    sendInvitation,
    acceptInvitation,
    rejectInvitation,
    getUserInvitations,
    requestToJoinTeam,
    approveJoinRequest,
    rejectJoinRequest,
    getTeamJoinRequests,
    updatePaymentStatus
} from '../controllers/teamController.js';

import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Tất cả các route đều yêu cầu xác thực (trừ khi có public, ví dụ GET /tournaments/:tournamentId/teams có thể public)
router.use(authenticate);

// ======================== TEAM CRUD ========================
router.post('/create', protectedRoute('player'), createTeam);                                    // Tạo đội
router.put('/edit/:id', protectedRoute('player'), updateTeam);                                 // Cập nhật đội
router.delete('/delete/:id', protectedRoute('player'), deleteTeam);                              // Xóa (soft delete) đội

// ======================== MEMBER MANAGEMENT ========================
router.get('/users', protectedRoute('player','org'), getUserTeams);                             // Lấy các đội user tham gia
router.get('/users/:id', getTeamDetail);                              // Chi tiết đội (kèm members)
router.get('/tournaments/:tournamentId/teams', getTeamsByTournament); // DS đội theo giải (public)
router.post('/:id/leave', protectedRoute('player'), leaveTeam);                           // Thành viên tự rời đội
router.delete('/:teamId/members/:memberId', protectedRoute('player'), kickMember);        // Captain xóa thành viên
router.post('/transfer-captain', protectedRoute('player'), transferCaptaincy);            // Chuyển quyền đội trưởng

// ======================== INVITATIONS (CAPTAIN INVITES) ========================
router.post('/invitations', protectedRoute('player'), sendInvitation);                    // Gửi lời mời (captain)
router.post('/invitations/:invitationId/accept', protectedRoute('player'), acceptInvitation); // Chấp nhận lời mời
router.post('/invitations/:invitationId/reject', protectedRoute('player'), rejectInvitation); // Từ chối lời mời
router.get('/users/invitations', protectedRoute('player'), getUserInvitations);                 // Lấy lời mời của user

// ======================== PLAYER REQUESTS (JOIN TEAM) ========================
router.post('/join-requests', protectedRoute('player'), requestToJoinTeam);               // Cầu thủ gửi yêu cầu tham gia
router.post('/join-requests/:requestId/approve', protectedRoute('player'), approveJoinRequest); // Captain duyệt
router.post('/join-requests/:requestId/reject', protectedRoute('player'), rejectJoinRequest);   // Captain từ chối
router.get('/:teamId/join-requests', protectedRoute('player'), getTeamJoinRequests);      // Lấy danh sách yêu cầu (captain)

// ======================== PAYMENT ========================
router.patch('/:id/payment', authorizeRoles('org', 'admin'), updatePaymentStatus); // Cập nhật thanh toán

export default router;