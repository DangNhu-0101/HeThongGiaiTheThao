import express from 'express';
import * as participantController from '../controllers/teamController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();


router.use(protectedRoute('player', { profile: 'player' }));

// CRUD
router.post('/', participantController.createParticipant);
router.get('/tournament/:tournamentItemId', participantController.getParticipantsByTournament);
router.get('/:id', participantController.getParticipant);
router.put('/:id', participantController.updateParticipant);
router.delete('/:id', participantController.deleteParticipant);

// Invitations
router.post('/:participantId/invitations', participantController.sendParticipantInvitation);
router.put('/invitations/:invitationId/accept', participantController.acceptParticipantInvitation);
router.put('/invitations/:invitationId/reject', participantController.rejectParticipantInvitation);
router.delete('/invitations/:invitationId/cancel', participantController.cancelParticipantInvitation);
router.get('/:participantId/invitations', participantController.getParticipantInvitations);
router.get('/invitations/my', participantController.getMyParticipantInvitations);

// Members management
router.delete('/:participantId/members/:memberId', participantController.removeMemberFromParticipant);
router.post('/:participantId/leave', participantController.leaveParticipant);

export default router;