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

router.post('/initialize/:tournamentId', protectedRoute('org'), initializeTournament);
router.post('/:groupId/sort-ranking', protectedRoute('org'), sortRankingInGroup);
router.post('/:groupId/add-team', protectedRoute('org'), addTeamToGroup);
router.post('/:groupId/update-status', protectedRoute('org'), updateGroupStatus);
router.post('/assign-teams', protectedRoute('org'), assignExistingTeamsToGroups);




export default router;