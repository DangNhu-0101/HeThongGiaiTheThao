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
    updatePaymentStatus,
    updateSponsorStatus
} from '../controllers/teamController.js';

import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ======================== TEAM CRUD ========================
router.post('/create', protectedRoute('player'), createTeam);                                    // Tạo đội
router.put('/edit/:id', protectedRoute('player, org'), updateTeam);                                 // Cập nhật đội
router.delete('/delete/:id',  deleteTeam);                              // Xóa  đội

// ======================== MEMBER MANAGEMENT ========================
router.get('/users', protectedRoute('player','org'), getUserTeams);                             // Lấy các đội user tham gia
router.get('/users/:id', getTeamDetail);                              // Chi tiết đội (kèm members)
router.get('/tournaments/:tournamentId/teams', getTeamsByTournament); // DS đội theo giải (public)
router.post('/:id/leave', protectedRoute('player'), leaveTeam);                           // Thành viên tự rời đội
router.delete('/:teamId/members/:memberId', protectedRoute('player, org'), kickMember);        // Captain xóa thành viên
router.post('/transfer-captain', protectedRoute('player, org'), transferCaptaincy);            // Chuyển quyền đội trưởng

// ======================== INVITATIONS (CAPTAIN INVITES) ========================
router.post('/invitations', protectedRoute('player, org'), sendInvitation);                    // Gửi lời mời (captain)
router.post('/invitations/:invitationId/accept', protectedRoute('player, org'), acceptInvitation); // Chấp nhận lời mời
router.post('/invitations/:invitationId/reject', protectedRoute('player, org'), rejectInvitation); // Từ chối lời mời
router.get('/users/invitations', protectedRoute('player, org'), getUserInvitations);                 // Lấy lời mời của user

// ======================== PLAYER REQUESTS (JOIN TEAM) ========================
router.post('/join-requests', protectedRoute('player'), requestToJoinTeam);               // Cầu thủ gửi yêu cầu tham gia
router.post('/join-requests/:requestId/approve', protectedRoute('player, org'), approveJoinRequest); // Captain duyệt
router.post('/join-requests/:requestId/reject', protectedRoute('player, org'), rejectJoinRequest);   // Captain từ chối
router.get('/:teamId/join-requests', protectedRoute('player, org'), getTeamJoinRequests);      // Lấy danh sách yêu cầu (captain)

// ======================== PAYMENT ========================
router.patch('/:id/payment', protectedRoute(['org', 'Organization']), updatePaymentStatus); // Cập nhật thanh toán
router.patch('/:id/sponsor', protectedRoute(['org', 'Organization', 'admin']), updateSponsorStatus); 


export default router;
