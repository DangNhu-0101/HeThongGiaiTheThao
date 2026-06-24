import express from 'express';
import {
    getMatchesByStage,
    getMatchesByBracket,
    getMatchesByGroup,
    getMatchById,
    updateMatch,
    autoResultMatch,
    completeMatch
} from '../controllers/matchController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/stage/:stageId', protectedRoute(), getMatchesByStage);
router.get('/bracket/:bracketId', protectedRoute(), getMatchesByBracket);
router.get('/group/:groupId', protectedRoute(), getMatchesByGroup);
router.get('/:id', protectedRoute(), getMatchById);
router.put('/:id', protectedRoute('admin', 'org'), updateMatch);
router.post('/:id/auto-result', protectedRoute('admin', 'org'), autoResultMatch);
router.post('/:id/complete', protectedRoute('admin', 'org'), completeMatch);

export default router;