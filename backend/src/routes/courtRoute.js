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
router.get('/:courtId', protectedRoute(), getCourtById);

// ========== CREATE ==========
router.post('/', protectedRoute('admin', 'org', 'organization', { profile: true }), addCourt);

// ========== UPDATE ==========
router.put('/:courtId', protectedRoute('admin', 'org', 'organization', { profile: true }), updateCourt);
router.patch('/:courtId/status', protectedRoute('admin', 'org', 'organization', { profile: true }), updateCourtStatus);

// ========== DELETE ==========
router.delete('/:courtId', protectedRoute('admin', 'org', 'organization', { profile: true }), deleteCourt);

export default router;
