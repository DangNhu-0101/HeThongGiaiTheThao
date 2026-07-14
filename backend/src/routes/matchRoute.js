// routes/matchRoutes.js
import express from 'express';
import {
    getMatchesByStage,
    getMatchesByTournamentItem,
    getKnockoutBracketByTournamentItem,
    getPublishedMatchesByTournamentItem,
    getMatchesByBracket,
    getMatchesByGroup,
    getMatchById,
    updateMatch,
    autoResultMatch,
    updateLiveMatchScore,
    completeMatch,
    autoScheduleStage,
    publishStageSchedule,
    publishScheduledMatchesByTournamentItem,
    syncMatchesFromFormat,
    updateMatches,
    deleteMatch,
    generateGroupStageMatches,
    getMatchStatusTags,
    getPublicStandingsByTournamentItem
} from '../controllers/matchController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/public/tournament-item/:tournamentItemId', getPublishedMatchesByTournamentItem);
router.get('/public/standings/:tournamentItemId', getPublicStandingsByTournamentItem);
router.get('/knockout/:tournamentItemId', getKnockoutBracketByTournamentItem);
router.get('/status-tags', protectedRoute(), getMatchStatusTags);
router.get('/stage/:stageId', protectedRoute(), getMatchesByStage);
router.get('/tournament-item/:tournamentItemId', protectedRoute(), getMatchesByTournamentItem);
router.get('/bracket/:bracketId', protectedRoute(), getMatchesByBracket);
router.get('/group/:groupId', protectedRoute(), getMatchesByGroup);
router.get('/:id', protectedRoute(), getMatchById);

router.post('/group-stage/generate', protectedRoute('admin', 'org', 'organization', { profile: true }), generateGroupStageMatches);
router.post('/tournament-item/:tournamentItemId/sync-from-format', protectedRoute('admin', 'org', 'organization', { profile: true }), syncMatchesFromFormat);
router.post('/tournament-item/:tournamentItemId/publish-scheduled', protectedRoute('admin', 'org', 'organization', { profile: true }), publishScheduledMatchesByTournamentItem);
router.post('/stage/:stageId/auto-schedule', protectedRoute('admin', 'org', 'organization', { profile: true }), autoScheduleStage);
router.post('/stage/:stageId/publish', protectedRoute('admin', 'org', 'organization', { profile: true }), publishStageSchedule);
router.put('/bulk', protectedRoute('admin', 'org', 'organization', { profile: true }), updateMatches);
router.put('/:id', protectedRoute('admin', 'org', 'organization', { profile: true }), updateMatch);
router.patch('/:id/live-score', protectedRoute('admin', 'org', 'organization', { profile: true }), updateLiveMatchScore);
router.post('/:id/auto-result', protectedRoute('admin', 'org', 'organization', { profile: true }), autoResultMatch);
router.post('/:id/complete', protectedRoute('admin', 'org', 'organization', { profile: true }), completeMatch);

router.delete('/:id', protectedRoute('admin', 'org', { profile: true }), deleteMatch);

export default router;
