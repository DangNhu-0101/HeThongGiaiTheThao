// routes/sponsorRoutes.js
import express from 'express';
import {
    getSponsorsByTournamentItem,
    getSponsorById,
    createSponsor,
    updateSponsor,
    deleteSponsor,
    deactivateSponsor,
    activateSponsor
} from '../controllers/sponsorController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ========== GET ==========
router.get('/tournament-item/:tournamentItemId', getSponsorsByTournamentItem);
router.get('/:id', protectedRoute(), getSponsorById);

// ========== CREATE ==========
router.post('/', protectedRoute('admin', 'org', 'organization', { profile: true }), createSponsor);

// ========== UPDATE ==========
router.put('/:id', protectedRoute('admin', 'org', 'organization', { profile: true }), updateSponsor);
router.patch('/:id/deactivate', protectedRoute('admin', 'org', 'organization', { profile: true }), deactivateSponsor);
router.patch('/:id/activate', protectedRoute('admin', 'org', 'organization', { profile: true }), activateSponsor);
router.delete('/:id', protectedRoute('admin', 'org', 'organization', { profile: true }), deleteSponsor);

export default router;
