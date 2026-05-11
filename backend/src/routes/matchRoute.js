import express from 'express';
import { protectedRoute } from '../middlewares/authMiddleware.js';
import { 
    getAllMatches, 
    getMatchesForReferee, 
    updateMatchScore, 
    autoDrawAndGenerateMatches,
    getDraftMatches,
    publishMatches,
    generateKnockout,
    getEditableMatches,
    autoAssignReferees,
    saveManualReferees
} from '../controllers/matchController.js';

const router = express.Router();

// Public hoặc chung
router.get('/all', getAllMatches);

// Dành cho Trọng tài
router.get('/referee', protectedRoute(['Referee']), getMatchesForReferee);
router.put('/:matchId/score', protectedRoute(['Referee', 'Organization']), updateMatchScore);

// BẢO MẬT: CHỈ DÀNH CHO ADMIN (Organization)
router.post('/auto-draw/:tournamentId', protectedRoute(['Organization']), autoDrawAndGenerateMatches);
router.post('/generate-knockout/:tournamentId', protectedRoute(['Organization']), generateKnockout);
router.post('/auto-assign-referees', protectedRoute(['Organization']), autoAssignReferees);
router.post('/save-referees', protectedRoute(['Organization']), saveManualReferees);
router.post('/publish', protectedRoute(['Organization']), publishMatches);

router.get('/draft-list', protectedRoute(['Organization']), getDraftMatches);
router.get('/editable-list', protectedRoute(['Organization']), getEditableMatches);

export default router;