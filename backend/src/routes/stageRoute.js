// routes/stageRoutes.js
import express from 'express';
import { protectedRoute } from '../middlewares/authMiddleware.js';
import {
    createStage,
    getStagesByTournamentItem,
    getStageById,
    updateStage,
    deleteStage,
    completeStage
} from '../controllers/stageController.js';

const router = express.Router();

// ========== PUBLIC ==========
router.get('/tournament-item/:tournamentItemId', protectedRoute(), getStagesByTournamentItem);
router.get('/:id', protectedRoute(), getStageById);

// ========== PROTECTED ==========
router.post('/', protectedRoute('admin', 'org', { profile: true }), createStage);
router.put('/:id', protectedRoute('admin', 'org', { profile: true }), updateStage);
router.delete('/:id', protectedRoute('admin', 'org', { profile: true }), deleteStage);
router.patch('/:id/complete', protectedRoute('admin', 'org', { profile: true }), completeStage);

export default router;