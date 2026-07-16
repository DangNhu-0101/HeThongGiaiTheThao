// routes/participantRoutes.js
import express from 'express';
import multer from 'multer';
import {
    createParticipant,
    getParticipantsByTournament,
    getParticipant,
    getMyParticipants,
    updateParticipant,
    deleteParticipant,
    sendParticipantInvitation,
    acceptParticipantInvitation,
    rejectParticipantInvitation,
    cancelParticipantInvitation,
    getParticipantInvitations,
    getMyParticipantInvitations,
    removeMemberFromParticipant,
    leaveParticipant,
    createParticipantByOrganization,
    downloadOrganizationImportTemplate,
    importParticipantsByOrganization,
    linkPlayerAccount,
    updatePlayerByOrganization,
    exportDefaultAccounts,
    exportTeamAthleteList,
    getPublicParticipant,
    updateParticipantReview,
    createJoinRequest,
    getMyJoinRequests,
    cancelJoinRequest,
    getParticipantJoinRequests,
    reviewJoinRequest,
    getParticipantFees,
    submitParticipantFee,
    cancelParticipantFeeReceipt,
    reviewParticipantFee,
    getSentParticipantInvitations
} from '../controllers/teamController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ========== CREATE ==========
router.post('/', protectedRoute('player', { profile: true }), createParticipant);
router.post('/organization', protectedRoute('admin', 'org', 'organization', { profile: true }), createParticipantByOrganization);
router.post('/organization/import', protectedRoute('admin', 'org', 'organization', { profile: true }), upload.single('file'), importParticipantsByOrganization);
router.get('/organization/import-template', protectedRoute('admin', 'org', 'organization', { profile: true }), downloadOrganizationImportTemplate);

// ========== GET ==========
router.get('/public/:idOrSlug', getPublicParticipant);
router.get('/tournament/:tournamentItemId', protectedRoute(), getParticipantsByTournament);
router.get('/tournament/:tournamentItemId/default-accounts', protectedRoute('admin', 'org', 'organization', { profile: true }), exportDefaultAccounts);
router.get('/tournament/:tournamentItemId/export-list', protectedRoute('admin', 'org', 'organization', { profile: true }), exportTeamAthleteList);
router.get('/my', protectedRoute('player', { profile: true }), getMyParticipants);
router.get('/join-requests/my', protectedRoute('player', { profile: true }), getMyJoinRequests);
router.get('/invitations/my', protectedRoute('player', { profile: true }), getMyParticipantInvitations);
router.get('/invitations/sent', protectedRoute('player', { profile: true }), getSentParticipantInvitations);
router.patch('/players/:playerId/link-account', protectedRoute('admin', 'org', 'organization', { profile: true }), linkPlayerAccount);
router.patch('/players/:playerId', protectedRoute('admin', 'org', 'organization', { profile: true }), updatePlayerByOrganization);
router.get('/:id', protectedRoute(), getParticipant);

// ========== UPDATE ==========
router.put('/:id', protectedRoute('player', { profile: true }), updateParticipant);
router.patch('/:id/review', protectedRoute('admin', 'org', 'organization', { profile: true }), updateParticipantReview);

// ========== DELETE ==========
router.delete('/:id', protectedRoute('admin', 'org', 'organization', 'player', { profile: true }), deleteParticipant);
router.delete('/join-requests/:requestId', protectedRoute('player', { profile: true }), cancelJoinRequest);

// ========== TEAM MEMBERS ==========
router.post('/:participantId/leave', protectedRoute('player', { profile: true }), leaveParticipant);
router.delete('/:participantId/members/:memberId', protectedRoute('player', { profile: true }), removeMemberFromParticipant);
router.get('/:participantId/join-requests', protectedRoute('player', { profile: true }), getParticipantJoinRequests);
router.post('/:participantId/join-requests', protectedRoute('player', { profile: true }), createJoinRequest);
router.patch('/join-requests/:requestId/review', protectedRoute('player', { profile: true }), reviewJoinRequest);
router.get('/:participantId/fees', protectedRoute(), getParticipantFees);
router.post('/:participantId/fees/receipt', protectedRoute('player', { profile: true }), submitParticipantFee);
router.delete('/:participantId/fees/:playerId/receipt', protectedRoute('player', { profile: true }), cancelParticipantFeeReceipt);
router.patch('/:participantId/fees/:playerId/review', protectedRoute(), reviewParticipantFee);

// ========== INVITATIONS ==========
router.post('/:participantId/invitations', protectedRoute('player', { profile: true }), sendParticipantInvitation);
router.put('/invitations/:invitationId/accept', protectedRoute('player', { profile: true }), acceptParticipantInvitation);
router.put('/invitations/:invitationId/reject', protectedRoute('player', { profile: true }), rejectParticipantInvitation);
router.delete('/invitations/:invitationId/cancel', protectedRoute('player', { profile: true }), cancelParticipantInvitation);
router.get('/:participantId/invitations', protectedRoute('player', { profile: true }), getParticipantInvitations);

export default router;
