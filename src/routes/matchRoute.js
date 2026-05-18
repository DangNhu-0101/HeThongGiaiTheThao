// routes/matchRoutes.js
import express from 'express';
import {
    autoGenerateGroupMatches,
    autoGenerateAllGroupMatches,
    createManualMatch,
    updateMatch,
    updateMatchStatus,
    updateMatchScore,
    deleteMatch
    //getMatchesByTournament,
} from '../controllers/matchController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();
 
// router.get('/tournaments/:tournamentId/matches',protectedRoute('player','referee','org'), getMatchesByTournament);

// Các route quản lý sân chỉ dành cho tổ chức (org) hoặc admin
router.post('/matches', protectedRoute('org'), createManualMatch);
router.put('/matches/:id', protectedRoute('org'), updateMatch);
router.patch('/matches/:id/status', protectedRoute('org'), updateMatchStatus);
router.patch('/matches/:id/score', protectedRoute('org'), updateMatchScore);
router.delete('/matches/:id', protectedRoute('org'), deleteMatch);



export default router;