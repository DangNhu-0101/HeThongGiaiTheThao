import express from 'express';
import {
    createParticipant,
    getParticipantsByTournament,
    getParticipant,
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

router.post(
    '/',
    protectedRoute('player', { profile: true }),
    createParticipant
);


router.get(
    '/tournament/:tournamentItemId',
    protectedRoute(),
    getParticipantsByTournament
);


router.get(
    '/:id',
    protectedRoute(),
    getParticipant
);


router.put(
    '/:id',
    protectedRoute('player'),
    updateParticipant
);


router.delete(
    '/:id',
    protectedRoute('player'),
    deleteParticipant
);

// ==================== Quản lý thành viên team ====================
// Rời khỏi team (self) - yêu cầu profile player
router.post(
    '/:participantId/leave',
    protectedRoute('player', { profile: true }),
    leaveParticipant
);

// Captain/member xóa thành viên khỏi team - yêu cầu profile player
router.delete(
    '/:participantId/members/:memberId',
    protectedRoute('player', { profile: true }),
    removeMemberFromParticipant
);

// ==================== Invitations ====================
// Gửi lời mời tham gia team - yêu cầu profile player
router.post(
    '/:participantId/invitations',
    protectedRoute('player', { profile: true }),
    sendParticipantInvitation
);

// Chấp nhận lời mời - yêu cầu profile player
router.put(
    '/invitations/:invitationId/accept',
    protectedRoute('player', { profile: true }),
    acceptParticipantInvitation
);

// Từ chối lời mời - yêu cầu profile player
router.put(
    '/invitations/:invitationId/reject',
    protectedRoute('player', { profile: true }),
    rejectParticipantInvitation
);

// Hủy lời mời (chỉ người gửi) - yêu cầu profile player
router.delete(
    '/invitations/:invitationId/cancel',
    protectedRoute('player', { profile: true }),
    cancelParticipantInvitation
);

// Lấy danh sách lời mời của một participant (dành cho captain/member) - yêu cầu auth + profile player
router.get(
    '/:participantId/invitations',
    protectedRoute('player', { profile: true }),
    getParticipantInvitations
);

// Lấy danh sách lời mời của user hiện tại (nhận được) - yêu cầu profile player
router.get(
    '/invitations/my',
    protectedRoute('player', { profile: true }),
    getMyParticipantInvitations
);

export default router;