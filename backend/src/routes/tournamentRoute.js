import express from 'express';
import {
    getAllTournaments,
    getTournamentByOrganization,
    getAllSingleSportTournaments,
    getSingleSportTournamentsByOrganization,
    getSingleTournamentById,
    getTournamentById,
    createSingleSportTournament,
    createMultiSportTournament,
    updateSingleSportTournament,
    updateMultiSportTournament,
    softDeleteSingleTournament,
    softDeleteMultiTournament,
    changeSingleStatus,
    changeMultiStatus
} from '../controllers/tuornamentController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ==================== GET ====================
// Multi-sport tournaments
router.get('/multi', protectedRoute(), getAllTournaments);
router.get('/multi/organization/my', protectedRoute(), getTournamentByOrganization);
router.get('/multi/:id', protectedRoute(), getTournamentById);

// Single-sport tournaments
router.get('/single', protectedRoute(), getAllSingleSportTournaments);
router.get('/single/organization/my', protectedRoute(), getSingleSportTournamentsByOrganization);
router.get('/single/:id', protectedRoute(), getSingleTournamentById);

// ==================== CREATE ====================
// Yêu cầu role admin hoặc org và có profile tổ chức
router.post(
    '/single',
    protectedRoute('admin', 'org', { profile: true }),
    createSingleSportTournament
);
router.post(
    '/multi',
    protectedRoute('admin', 'org', { profile: true }),
    createMultiSportTournament
);

// ==================== UPDATE ====================
router.put(
    '/single/:id',
    protectedRoute('admin', 'org'),
    updateSingleSportTournament
);
router.put(
    '/multi/:id',
    protectedRoute('admin', 'org'),
    updateMultiSportTournament
);

// ==================== SOFT DELETE ====================
router.delete(
    '/single/:id',
    protectedRoute('admin', 'org'),
    softDeleteSingleTournament
);
router.delete(
    '/multi/:id',
    protectedRoute('admin', 'org'),
    softDeleteMultiTournament
);

// ==================== CHANGE STATUS ====================
router.patch(
    '/single/:id/status',
    protectedRoute('admin', 'org'),
    changeSingleStatus
);
router.patch(
    '/multi/:id/status',
    protectedRoute('admin', 'org'),
    changeMultiStatus
);

export default router;