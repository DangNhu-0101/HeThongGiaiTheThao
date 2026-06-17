// routes/courtRoutes.js
import express from 'express';
import {
    getCourtsByTournamentItem,
    addCourt,
    updateCourt,
    updateCourtStatus,
    deleteCourt
} from '../controllers/courtController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Lấy danh sách sân theo tournamentItemId (có phân trang, lọc)
router.get('/tournament-item/:tournamentItemId', protectedRoute(), getCourtsByTournamentItem);

// Thêm sân mới
router.post('/', protectedRoute('admin', 'org'), addCourt);

// Cập nhật thông tin sân
router.put('/:courtId', protectedRoute('admin', 'org'), updateCourt);

// Cập nhật trạng thái sân
router.patch('/:courtId/status', protectedRoute('admin', 'org'), updateCourtStatus);

// Xóa sân
router.delete('/:courtId', protectedRoute('admin', 'org'), deleteCourt);

export default router;