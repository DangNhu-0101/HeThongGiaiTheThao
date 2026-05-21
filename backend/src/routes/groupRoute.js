import express from 'express';
import {
    sortRankingInGroup,
    addTeamToGroup,
    updateGroupStatus,
    assignExistingTeamsToGroups,
    initializeTournament  // ← THÊM
} from '../controllers/groupController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/assign-teams', protectedRoute('org'), assignExistingTeamsToGroups);
router.post('/initialize/:tournamentId', protectedRoute('org'), initializeTournament);
router.get('/:groupId/ranking', sortRankingInGroup);
router.post('/:groupId/add-team', protectedRoute('org'), addTeamToGroup);
router.patch('/:groupId/status', protectedRoute('org'), updateGroupStatus);



export default router;