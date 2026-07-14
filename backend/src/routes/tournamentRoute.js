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
    getOpenRegistrationTournamentItems,
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
router.get('/', getAllTournaments);
router.get('/open-registration', getOpenRegistrationTournamentItems);
router.get('/single', getAllSingleSportTournaments);
router.get('/multi/:id', getTournamentById);
router.get('/single/:id', getSingleTournamentById);

// ========== GET BY ORGANIZATION ==========
router.get('/my/single', protectedRoute(), getSingleSportTournamentsByOrganization);
router.get('/my/multi', protectedRoute(), getTournamentByOrganization);

// ========== CREATE ==========
router.post('/single', protectedRoute('admin', 'org', 'organization', { profile: true }), createSingleSportTournament);
router.post('/multi', protectedRoute('admin', 'org', 'organization', { profile: true }), createMultiSportTournament);

// ========== UPDATE ==========
router.put('/single/:id', protectedRoute('admin', 'org', 'organization', { profile: true }), updateSingleSportTournament);
router.put('/multi/:id', protectedRoute('admin', 'org', 'organization', { profile: true }), updateMultiSportTournament);

// ========== DELETE ==========
router.delete('/single/:id', protectedRoute('admin', 'org', 'organization', { profile: true }), softDeleteSingleTournament);
router.delete('/multi/:id', protectedRoute('admin', 'org', 'organization', { profile: true }), softDeleteMultiTournament);

// ========== CHANGE STATUS ==========
router.patch('/single/:id/status', protectedRoute('admin', 'org', 'organization', { profile: true }), changeSingleStatus);
router.patch('/multi/:id/status', protectedRoute('admin', 'org', 'organization', { profile: true }), changeMultiStatus);

export default router;
