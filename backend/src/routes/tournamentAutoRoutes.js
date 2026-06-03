import express from 'express';
import {
    initializeTournamentFromStageRule,
    advanceToKnockoutStage,
    previewQualifiedTeams,
    publishGroupStage,
    publishKnockoutStage
} from '../controllers/tournamentAutoController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Khởi tạo toàn bộ giải đấu: tạo bảng, phân đội, xếp lịch vòng bảng
router.post('/tournament/:tournamentId/initialize', protectedRoute('org'), initializeTournamentFromStageRule);
router.patch('/tournament/:tournamentId/publish-groups', protectedRoute('org'), publishGroupStage);
router.patch('/tournament/:tournamentId/publish-knockout', protectedRoute('org'), publishKnockoutStage);
router.post('/:tournamentId/init-groups', protectedRoute('org'), initializeTournamentFromStageRule);
router.patch('/:tournamentId/publish-groups', protectedRoute('org'), publishGroupStage);
router.patch('/:tournamentId/publish-knockout', protectedRoute('org'), publishKnockoutStage);

// Xem trước đội đi tiếp
router.get('/tournament/:tournamentId/qualified-teams', previewQualifiedTeams);

// Tạo lịch knock-out
router.post('/tournament/:tournamentId/advance-knockout', protectedRoute('org'), advanceToKnockoutStage);
router.post('/:tournamentId/advance-knockout', protectedRoute('org'), advanceToKnockoutStage);

export default router;
