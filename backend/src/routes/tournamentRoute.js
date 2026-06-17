// routes/tournamentRoutes.js
import express from 'express';
import {
    getAllTournaments, // hội thao
    getTournamentByOrganization, // hội thao theo tổ chức
    getAllSingleSportTournaments, // giải đơn môn
    getSingleSportTournamentsByOrganization, // giải đơn môn theo tổ chức
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

// ==================== MULTI SPORT TOURNAMENTS (HỘI THAO) ====================
router.get('/multi', protectedRoute(), getAllTournaments);
router.get('/multi/organization/my', protectedRoute(), getTournamentByOrganization);
router.get('/multi/:id', protectedRoute(), getTournamentById);

// ==================== SINGLE SPORT TOURNAMENTS (GIẢI ĐƠN MÔN) ====================
router.get('/single', protectedRoute(), getAllSingleSportTournaments);
router.get('/single/organization/my', protectedRoute(), getSingleSportTournamentsByOrganization);
router.get('/single/:id', protectedRoute(), getSingleTournamentById);

// ==================== CREATE ====================
router.post('/single', protectedRoute('admin', 'org'), createSingleSportTournament);
router.post('/multi', protectedRoute('admin', 'org'), createMultiSportTournament);

// ==================== UPDATE ====================
router.put('/single/:id', protectedRoute('admin', 'org'), updateSingleSportTournament);
router.put('/multi/:id', protectedRoute('admin', 'org'), updateMultiSportTournament);

// ==================== SOFT DELETE ====================
router.delete('/single/:id', protectedRoute('admin', 'org'), softDeleteSingleTournament);
router.delete('/multi/:id', protectedRoute('admin', 'org'), softDeleteMultiTournament);

// ==================== CHANGE STATUS ====================
router.patch('/single/:id/status', protectedRoute('admin', 'org'), changeSingleStatus);
router.patch('/multi/:id/status', protectedRoute('admin', 'org'), changeMultiStatus);

export default router;