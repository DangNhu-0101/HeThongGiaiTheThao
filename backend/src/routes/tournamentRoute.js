// routes/tournamentRoutes.js
import express from 'express';
import {
    getAllTournaments,
    getTournamentByOrganization,
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

// GET
router.get('/', protectedRoute(), getAllTournaments);
router.get('/organization/my', protectedRoute(), getTournamentByOrganization);
router.get('/single/:id', protectedRoute(), getSingleTournamentById);
router.get('/multi/:id', protectedRoute(), getTournamentById);

// POST
router.post('/single', protectedRoute('admin', 'org'), createSingleSportTournament);
router.post('/multi', protectedRoute('admin', 'org'), createMultiSportTournament);

// PUT
router.put('/single/:id', protectedRoute('admin', 'org'), updateSingleSportTournament);
router.put('/multi/:id', protectedRoute('admin', 'org'), updateMultiSportTournament);

// DELETE
router.delete('/single/:id', protectedRoute('admin', 'org'), softDeleteSingleTournament);
router.delete('/multi/:id', protectedRoute('admin', 'org'), softDeleteMultiTournament);

// PATCH
router.patch('/single/:id/status', protectedRoute('admin', 'org'), changeSingleStatus);
router.patch('/multi/:id/status', protectedRoute('admin', 'org'), changeMultiStatus);

export default router;