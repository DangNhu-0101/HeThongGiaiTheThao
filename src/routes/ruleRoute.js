// routes/ruleRoutes.js
import express from 'express';
import {
    getBaseRules,
    getAllRules,
    getDetailRules,
    editRule,
    deleteRule
} from '../controllers/ruleController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();


// GET /api/rules/systems? (lấy BaseRules theo sport)
router.get('/systems', getBaseRules);

// GET /api/rules?tournamentId=... (lấy tất cả rule của giải đấu)
router.get('/', protectedRoute(['org', 'Organization']), getAllRules);

// GET /api/rules/:id (lấy chi tiết 1 rule)
router.get('/:id', protectedRoute(['org', 'Organization']), getDetailRules);

// PUT /api/rules/:id (chỉnh sửa rule)
router.put('/:id', protectedRoute(['org', 'Organization']), editRule);

// DELETE /api/rules/:id (xóa rule)
router.delete('/:id', protectedRoute(['org', 'Organization']), deleteRule);

export default router;
