// routes/participantRoutes.js
import express from 'express';
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
    leaveParticipant
} from '../controllers/teamController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ========== CREATE ==========
router.post('/', protectedRoute('player', { profile: true }), createParticipant);

// ========== GET ==========
router.get('/tournament/:tournamentItemId', protectedRoute(), getParticipantsByTournament);
router.get('/my', protectedRoute('player', { profile: true }), getMyParticipants);
router.get('/:id', protectedRoute(), getParticipant);

// ========== UPDATE ==========
router.put('/:id', protectedRoute('player', { profile: true }), updateParticipant);

// ========== DELETE ==========
router.delete('/:id', protectedRoute('player', { profile: true }), deleteParticipant);

// ========== TEAM MEMBERS ==========
router.post('/:participantId/leave', protectedRoute('player', { profile: true }), leaveParticipant);
router.delete('/:participantId/members/:memberId', protectedRoute('player', { profile: true }), removeMemberFromParticipant);

// ========== INVITATIONS ==========
router.post('/:participantId/invitations', protectedRoute('player', { profile: true }), sendParticipantInvitation);
router.put('/invitations/:invitationId/accept', protectedRoute('player', { profile: true }), acceptParticipantInvitation);
router.put('/invitations/:invitationId/reject', protectedRoute('player', { profile: true }), rejectParticipantInvitation);
router.delete('/invitations/:invitationId/cancel', protectedRoute('player', { profile: true }), cancelParticipantInvitation);
router.get('/:participantId/invitations', protectedRoute('player', { profile: true }), getParticipantInvitations);
router.get('/invitations/my', protectedRoute('player', { profile: true }), getMyParticipantInvitations);

export default router;