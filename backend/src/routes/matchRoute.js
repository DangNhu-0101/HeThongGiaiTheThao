// routes/matchRoutes.js
import express from 'express';
import {
    getMatchesByStage,
    getMatchesByBracket,
    getMatchesByGroup,
    getMatchById,
    updateMatch,
    autoResultMatch,
    completeMatch,
    updateMatches,
    deleteMatch
} from '../controllers/matchController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js'; // Sửa thành protectedRoute

const router = express.Router();

// ========== GET (public, chỉ cần đăng nhập) ==========
router.get('/stage/:stageId', protectedRoute(), getMatchesByStage);
router.get('/bracket/:bracketId', protectedRoute(), getMatchesByBracket);
router.get('/group/:groupId', protectedRoute(), getMatchesByGroup);
router.get('/:id', protectedRoute(), getMatchById);

// ========== UPDATE (yêu cầu admin hoặc org + profile) ==========
router.put('/:id', protectedRoute('admin', 'org', { profile: true }), updateMatch);
router.post('/:id/auto-result', protectedRoute('admin', 'org', { profile: true }), autoResultMatch);
router.post('/:id/complete', protectedRoute('admin', 'org', { profile: true }), completeMatch);

// Bulk update
router.put('/bulk', protectedRoute('admin', 'org', { profile: true }), updateMatches);

// Delete
router.delete('/:id', protectedRoute('admin', 'org', { profile: true }), deleteMatch);

export default router;