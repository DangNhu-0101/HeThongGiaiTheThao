// routes/tournamentRoutes.js
import express from 'express';
import { protectedRoute } from '../middlewares/authMiddleware.js';
import {
    getAllTournaments,
    getAllSingleSportTournaments,
    getSingleSportTournamentsByOrganization,
    getTournamentByOrganization,
    getTournamentById,
    getSingleTournamentById,
    createSingleSportTournament,
    createMultiSportTournament,
    updateSingleSportTournament,
    updateMultiSportTournament,
    softDeleteSingleTournament,
    softDeleteMultiTournament,
    changeSingleStatus,
    changeMultiStatus
} from '../controllers/tuornamentController.js';

const router = express.Router();

// ========== GET ==========
router.get('/', protectedRoute(), getAllTournaments);
router.get('/single', protectedRoute(), getAllSingleSportTournaments);
router.get('/multi/:id', protectedRoute(), getTournamentById);
router.get('/single/:id', protectedRoute(), getSingleTournamentById);

// ========== GET BY ORGANIZATION ==========
router.get('/my/single', protectedRoute(), getSingleSportTournamentsByOrganization);
router.get('/my/multi', protectedRoute(), getTournamentByOrganization);

// ========== CREATE ==========
router.post('/single', protectedRoute('admin', 'org', { profile: true }), createSingleSportTournament);
router.post('/multi', protectedRoute('admin', 'org', { profile: true }), createMultiSportTournament);

// ========== UPDATE ==========
router.put('/single/:id', protectedRoute('admin', 'org', { profile: true }), updateSingleSportTournament);
router.put('/multi/:id', protectedRoute('admin', 'org', { profile: true }), updateMultiSportTournament);

// ========== DELETE ==========
router.delete('/single/:id', protectedRoute('admin', 'org', { profile: true }), softDeleteSingleTournament);
router.delete('/multi/:id', protectedRoute('admin', 'org', { profile: true }), softDeleteMultiTournament);

// ========== CHANGE STATUS ==========
router.patch('/single/:id/status', protectedRoute('admin', 'org', { profile: true }), changeSingleStatus);
router.patch('/multi/:id/status', protectedRoute('admin', 'org', { profile: true }), changeMultiStatus);

export default router;