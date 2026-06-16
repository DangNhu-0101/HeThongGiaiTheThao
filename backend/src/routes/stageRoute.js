// routes/stageRoutes.js
import express from 'express';
import {
    createStage,
    getStagesByTournamentItem,
    getStageById,
    updateStage,
    deleteStage,
    completeStage
} from '../controllers/stageController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Tạo stage mới
router.post('/', protectedRoute('admin', 'org'), createStage);

// Lấy danh sách stages của tournament item
router.get('/tournament-item/:tournamentItemId', protectedRoute(), getStagesByTournamentItem);

// Lấy chi tiết stage (kèm brackets, groups, matches)
router.get('/:id', protectedRoute(), getStageById);

// Cập nhật stage
router.put('/:id', protectedRoute('admin', 'org'), updateStage);

// Xóa stage (cascade)
router.delete('/:id', protectedRoute('admin', 'org'), deleteStage);

// Hoàn thành stage và kích hoạt stage tiếp theo
router.patch('/:id/complete', protectedRoute('admin', 'org'), completeStage);

export default router;