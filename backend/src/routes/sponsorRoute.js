// routes/sponsorRoutes.js
import express from 'express';
import {
    getSponsorsByTournamentItem,
    getSponsorById,
    createSponsor,
    updateSponsor,
    deactivateSponsor,
    activateSponsor
} from '../controllers/sponsorController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Lấy danh sách sponsor theo tournamentItemId (có phân trang, lọc)
router.get('/tournament-item/:tournamentItemId', protectedRoute(), getSponsorsByTournamentItem);

// Lấy chi tiết sponsor
router.get('/:id', protectedRoute(), getSponsorById);

// Tạo sponsor mới
router.post('/', protectedRoute('admin', 'org'), createSponsor);

// Cập nhật sponsor
router.put('/:id', protectedRoute('admin', 'org'), updateSponsor);

// Vô hiệu hóa sponsor
router.patch('/:id/deactivate', protectedRoute('admin', 'org'), deactivateSponsor);

// Kích hoạt lại sponsor
router.patch('/:id/activate', protectedRoute('admin', 'org'), activateSponsor);

export default router;