// routes/sponsorRoutes.js
import express from 'express';
import {
    getSponsorsByTournamentItem,
    getSponsorById,
    createSponsor,
    updateSponsor,
    deactivateSponsor,
    activateSponsor
} from '../controllers/sponsorController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ========== GET ==========
router.get('/tournament-item/:tournamentItemId', protectedRoute(), getSponsorsByTournamentItem);
router.get('/:id', protectedRoute(), getSponsorById);

// ========== CREATE ==========
router.post('/', protectedRoute('admin', 'org', { profile: true }), createSponsor);

// ========== UPDATE ==========
router.put('/:id', protectedRoute('admin', 'org', { profile: true }), updateSponsor);
router.patch('/:id/deactivate', protectedRoute('admin', 'org', { profile: true }), deactivateSponsor);
router.patch('/:id/activate', protectedRoute('admin', 'org', { profile: true }), activateSponsor);

export default router;