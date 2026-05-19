// routes/matchRoutes.js
import express from 'express';
import {
    autoGenerateGroupMatches,
    autoGenerateAllGroupMatches,
    autoDrawTournamentMatches,
    publishDraftMatches,
    getMatches,
    getMatchById,
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
router.get('/', getMatches);
router.post('/auto-draw/:tournamentId', protectedRoute(['org', 'Organization']), autoDrawTournamentMatches);
router.post('/publish', protectedRoute(['org', 'Organization']), publishDraftMatches);
router.post('/groups/:groupId/generate', protectedRoute(['org', 'Organization']), autoGenerateGroupMatches);
router.post('/generate-groups', protectedRoute(['org', 'Organization']), autoGenerateAllGroupMatches);
router.get('/:id', getMatchById);
router.post('/', protectedRoute(['org', 'Organization']), createManualMatch);
router.put('/:id', protectedRoute(['org', 'Organization']), updateMatch);
router.patch('/:id/status', protectedRoute(['org', 'Organization']), updateMatchStatus);
router.patch('/:id/score', protectedRoute(['org', 'Organization']), updateMatchScore);
router.delete('/:id', protectedRoute(['org', 'Organization']), deleteMatch);



export default router;
