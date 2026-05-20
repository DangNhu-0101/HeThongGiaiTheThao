import express from 'express';
import { 
    initializeTournamentFromStageRule, 
    advanceToKnockoutStage,
    previewQualifiedTeams 
} from '../controllers/tournamentAutoController.js';

const router = express.Router();

// Khởi tạo toàn bộ giải đấu (tạo group, phân đội, xếp lịch vòng bảng)
router.post('/tournament/:tournamentId/initialize', initializeTournamentFromStageRule);

// Xem trước đội đi tiếp
router.get('/tournament/:tournamentId/qualified-teams', previewQualifiedTeams);

// Tạo lịch knock-out
router.post('/tournament/:tournamentId/advance-knockout', advanceToKnockoutStage);

export default router;