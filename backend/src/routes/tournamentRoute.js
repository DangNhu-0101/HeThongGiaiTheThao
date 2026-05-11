import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    getAllTournament,
    createTournament,
    editTournament,
    getTournament,
    cancelTournament
} from '../controllers/tournamentController.js';

import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Các route công khai (không cần đăng nhập)
router.get('/', getAllTournament);               // Lấy danh sách giải đấu (phân trang, lọc)
router.get('/:id', getTournament);               // Lấy chi tiết giải đấu



// Tạo giải đấu mới (có upload file)
router.post('/',protectedRoute('org'), createTournament);

// Chỉnh sửa giải đấu (có upload file)
router.put('/:id', protectedRoute('org'), editTournament);

// Hủy giải đấu (chuyển status thành cancelled)
router.put('/:id/cancel', protectedRoute('org'), cancelTournament);

export default router;