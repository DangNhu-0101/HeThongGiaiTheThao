// routes/courtRoutes.js
import express from 'express';
import {
    getCourtsByTournamentItem,
    getCourtById,
    addCourt,
    updateCourt,
    updateCourtStatus,
    deleteCourt
} from '../controllers/courtController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ========== GET ==========
router.get('/tournament-item/:tournamentItemId', protectedRoute(), getCourtsByTournamentItem);
router.get('/', protectedRoute(), getCourtsByTournamentItem);
router.get('/:courtId', protectedRoute(), getCourtById);

// ========== CREATE ==========
router.post('/', protectedRoute('admin'), addCourt);

// ========== UPDATE ==========
router.put('/:courtId', protectedRoute('admin'), updateCourt);
router.patch('/:courtId/status', protectedRoute('admin'), updateCourtStatus);

// ========== DELETE ==========
router.delete('/:courtId', protectedRoute('admin'), deleteCourt);

export default router;
