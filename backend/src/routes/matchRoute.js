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

router.post('/auto-draw/:tournamentId', autoDrawTournamentMatches);
router.post('/publish', publishDraftMatches);
router.post('/groups/:groupId/generate', protectedRoute('org'), autoGenerateGroupMatches);
router.post('/generate-groups', protectedRoute('org'), autoGenerateAllGroupMatches);
router.get('/', getMatches);
router.get('/:id', getMatchById);
router.post('/', protectedRoute('org'), createManualMatch);
router.put('/:id', protectedRoute('org'), updateMatch);
router.patch('/:id/status', protectedRoute('org'), updateMatchStatus);
router.patch('/:id/score', protectedRoute('org'), updateMatchScore);
router.delete('/:id', protectedRoute('org'), deleteMatch);



export default router;
