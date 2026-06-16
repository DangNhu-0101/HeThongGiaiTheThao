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
import { protectedRoute } from '../middlewares/auth.js';

const router = express.Router();

// Lấy danh sách nhà tài trợ của giải đấu (có phân trang, lọc)
router.get('/', protectedRoute(), getSponsorsByTournament);

// Lấy chi tiết nhà tài trợ
router.get('/:id', protectedRoute(), getSponsorById);

// Tạo nhà tài trợ mới (yêu cầu admin hoặc org)
router.post('/', protectedRoute('admin', 'org'), createSponsor);

// Cập nhật nhà tài trợ (yêu cầu admin hoặc org)
router.put('/:id', protectedRoute('admin', 'org'), updateSponsor);

// Vô hiệu hóa nhà tài trợ (yêu cầu admin hoặc org)
router.patch('/:id/deactivate', protectedRoute('admin', 'org'), deactivateSponsor);

// Kích hoạt lại nhà tài trợ (yêu cầu admin hoặc org)
router.patch('/:id/activate', protectedRoute('admin', 'org'), activateSponsor);

export default router;