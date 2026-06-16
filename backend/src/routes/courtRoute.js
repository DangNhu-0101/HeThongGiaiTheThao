// routes/courtRoutes.js
import express from 'express';
import {
    getCourtsByTournament,
    addCourt,
    updateCourt,
    updateCourtStatus,
    deleteCourt
} from '../controllers/courtController.js';
import { protectedRoute } from '../middlewares/auth.js';

const router = express.Router();

// Lấy danh sách sân của giải đấu (có phân trang, lọc)
router.get('/tournament/:tournamentId', protectedRoute(), getCourtsByTournament);

// Thêm sân mới cho giải đấu (yêu cầu admin hoặc org)
router.post('/', protectedRoute('admin', 'org'), addCourt);

// Cập nhật thông tin sân (yêu cầu admin hoặc org)
router.put('/:courtId', protectedRoute('admin', 'org'), updateCourt);

// Cập nhật trạng thái sân (yêu cầu admin hoặc org)
router.patch('/:courtId/status', protectedRoute('admin', 'org'), updateCourtStatus);

// Xóa sân (yêu cầu admin hoặc org)
router.delete('/:courtId', protectedRoute('admin', 'org'), deleteCourt);

export default router;