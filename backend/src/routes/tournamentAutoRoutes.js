import express from 'express';
import { 
    initializeTournamentFromStageRule, 
    advanceToKnockoutStage,
    previewQualifiedTeams,
    publishGroupStage
} from '../controllers/tournamentAutoController.js';

const router = express.Router();

// Khởi tạo toàn bộ giải đấu (tạo group, phân đội, xếp lịch vòng bảng)
router.post('/tournament/:tournamentId/initialize', initializeTournamentFromStageRule);
router.post('/:tournamentId/init-groups', initializeTournamentFromStageRule);
router.patch('/:tournamentId/publish-groups', publishGroupStage);

// Xem trước đội đi tiếp
router.get('/tournament/:tournamentId/qualified-teams', previewQualifiedTeams);

// Tạo lịch knock-out
router.post('/tournament/:tournamentId/advance-knockout', advanceToKnockoutStage);
router.post('/:tournamentId/advance-knockout', advanceToKnockoutStage);

export default router;
