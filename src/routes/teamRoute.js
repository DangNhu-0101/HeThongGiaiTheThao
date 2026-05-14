// routes/teamRoutes.js
import express, { Router } from 'express';
import {
    createTeam, updateTeam, deleteTeam,
    getUserTeams, getTeamDetail, getTeamsByTournament,
    leaveTeam, kickMember, transferCaptaincy,
    sendInvitation, acceptInvitation, rejectInvitation, getUserInvitations,
    requestToJoinTeam, approveJoinRequest, rejectJoinRequest, getTeamJoinRequests,
    updatePaymentStatus, registerFlow , getSentInvitations
} from '../controllers/teamController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ======================== PUBLIC ========================
router.get('/all', getTeamsByTournament);
router.get('/', getTeamsByTournament);

// ======================== TEAM CRUD ========================
// THÊM dòng này trước export default router:
router.post('/register-flow', protectedRoute('player'), registerFlow);
router.put('/edit/:id', protectedRoute('player'), updateTeam);
router.delete('/delete/:id', protectedRoute('player'), deleteTeam);

// ======================== USER SPECIFIC (cụ thể trước) ========================
router.get('/users/invitations', protectedRoute('player', 'Organization'), getUserInvitations); 
router.get('/users/sent-invitations', protectedRoute('player', 'Organization'), getSentInvitations);
router.get('/users', protectedRoute('player','Organization'), getUserTeams);
router.get('/users/:id', getTeamDetail);


// ======================== TOURNAMENT TEAMS ========================
router.get('/tournaments/:tournamentId/teams', getTeamsByTournament);

// ======================== INVITATIONS ========================
router.post('/invitations', protectedRoute('player'), sendInvitation);
router.post('/invitations/:invitationId/accept', protectedRoute('player'), acceptInvitation);
router.post('/invitations/:invitationId/reject', protectedRoute('player'), rejectInvitation);

// ======================== JOIN REQUESTS (cụ thể trước) ========================
router.post('/join-requests', protectedRoute('player'), requestToJoinTeam);
router.post('/join-requests/:requestId/approve', protectedRoute('player'), approveJoinRequest);
router.post('/join-requests/:requestId/reject', protectedRoute('player'), rejectJoinRequest);

// ======================== MEMBER ACTIONS (động sau) ========================
router.post('/transfer-captain', protectedRoute('player'), transferCaptaincy);
router.post('/:id/leave', protectedRoute('player'), leaveTeam);
router.delete('/:teamId/members/:memberId', protectedRoute('player'), kickMember);
router.get('/:teamId/join-requests', protectedRoute('player'), getTeamJoinRequests);

// ======================== PAYMENT ========================
router.patch('/:id/payment', protectedRoute('Organization'), updatePaymentStatus);

export default router;