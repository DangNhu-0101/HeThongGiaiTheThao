// routes/sponsorRoutes.js
import express from 'express';
import {
    getSponsorsByTournament,
    getSponsorById,
    createSponsor,
    updateSponsor,
    deactivateSponsor,
    activateSponsor
} from '../controllers/sponsorController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes (hoặc có thể cần authenticate tùy nhu cầu)
router.get('/tournaments/:tournamentId/sponsors', getSponsorsByTournament);
router.get('/sponsors/:id', getSponsorById);

// Routes yêu cầu đăng nhập và quyền tổ chức (org) hoặc admin
router.post('/sponsors', protectedRoute('org'), createSponsor);
router.put('/sponsors/:id', protectedRoute('org'), updateSponsor);
router.patch('/sponsors/:id/deactivate', protectedRoute('org'), deactivateSponsor);
router.patch('/sponsors/:id/activate', protectedRoute('org'), activateSponsor);

export default router;