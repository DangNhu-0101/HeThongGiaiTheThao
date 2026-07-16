// routes/stageRoutes.js
import express from 'express';
import { protectedRoute } from '../middlewares/authMiddleware.js';
import {
    createStage,
    getStagesByTournamentItem,
    getStageById,
    updateStage,
    deleteStage,
    completeStage,
    getTournamentCompetitionFormat,
    saveTournamentCompetitionFormat,
    publishStageStandings,
    previewStageSeeding
} from '../controllers/stageController.js';

const router = express.Router();

// ========== PUBLIC ==========
router.get('/format/:tournamentItemId', getTournamentCompetitionFormat);
router.get('/tournament-item/:tournamentItemId', getStagesByTournamentItem);
router.get('/:id', getStageById);

// ========== PROTECTED ==========
router.put('/format/:tournamentItemId', protectedRoute(), saveTournamentCompetitionFormat);
router.post('/seed-preview/:tournamentItemId', protectedRoute('admin', 'org', 'organization', { profile: true }), previewStageSeeding);
router.post('/', protectedRoute('admin', 'org', 'organization', { profile: true }), createStage);
router.put('/:id', protectedRoute('admin', 'org', 'organization', { profile: true }), updateStage);
router.delete('/:id', protectedRoute('admin', 'org', 'organization', { profile: true }), deleteStage);
router.patch('/:id/complete', protectedRoute('admin', 'org', 'organization', { profile: true }), completeStage);
router.patch('/:id/standings/publish', protectedRoute('admin', 'org', 'organization', { profile: true }), publishStageStandings);

export default router;
