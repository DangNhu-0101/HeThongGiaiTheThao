// routes/courtRoutes.js
import express from 'express';
import {
    getCourtsByTournament,
    addCourt,
    updateCourt,
    updateCourtStatus,
    deleteCourt
} from '../controllers/courtController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';
import Referee from '../models/referees.js';

const router = express.Router();

// Lấy danh sách sân của giải đấu (có thể public, nhưng vẫn yêu cầu đăng nhập nếu cần)
router.get('/tournaments/:tournamentId/courts',protectedRoute('player','referee','org'), getCourtsByTournament);

// Các route quản lý sân chỉ dành cho tổ chức (org) hoặc admin
router.post('/courts', protectedRoute('org'), addCourt);
router.put('/courts/:courtId', protectedRoute('org'), updateCourt);
router.patch('/courts/:courtId/status', protectedRoute('org'), updateCourtStatus);
router.delete('/courts/:courtId',protectedRoute('org'), deleteCourt);

export default router;