// routes/tournamentRoutes.js
import express from 'express';
import { protectedRoute } from '../middlewares/authMiddleware.js';
import {
    getAllTournaments,
    getAllSingleSportTournaments,
    getSingleSportTournamentsByOrganization,
    getTournamentByOrganization,
    getTournamentById,
    getSingleTournamentById,
    getPublicTournamentStats,
    getOpenRegistrationTournamentItems,
    createSingleSportTournament,
    createMultiSportTournament,
    updateSingleSportTournament,
    updateMultiSportTournament,
    softDeleteSingleTournament,
    softDeleteMultiTournament,
    exportSingleTournamentPdf,
    changeSingleStatus,
    changeMultiStatus
} from '../controllers/tuornamentController.js';
import {
    applyTournamentTemplateFormat,
    generateTournamentCompetitionFormat,
    getEligibleTeamsForTournament,
    getTournamentCompetitionFormatAlias,
    getWildcardCandidates,
    previewWildcard,
    confirmWildcard,
    previewTeamPlacement,
    confirmTeamPlacement,
    saveTournamentCompetitionFormatAlias,
    validateTournamentCompetitionFormat
} from '../controllers/stageController.js';

const router = express.Router();

// ========== GET ==========
router.get('/', getAllTournaments);
router.get('/public-stats', getPublicTournamentStats);
router.get('/open-registration', getOpenRegistrationTournamentItems);
router.get('/:id/eligible-teams', protectedRoute('admin', 'org', 'organization', { profile: true }), getEligibleTeamsForTournament);
router.get('/:id/format', protectedRoute('admin', 'org', 'organization', { profile: true }), getTournamentCompetitionFormatAlias);
router.post('/:id/format/validate', protectedRoute('admin', 'org', 'organization', { profile: true }), validateTournamentCompetitionFormat);
router.post('/:id/format/apply-template', protectedRoute('admin', 'org', 'organization', { profile: true }), applyTournamentTemplateFormat);
router.post('/:id/format/generate', protectedRoute('admin', 'org', 'organization', { profile: true }), generateTournamentCompetitionFormat);
router.put('/:id/format', protectedRoute('admin', 'org', 'organization', { profile: true }), saveTournamentCompetitionFormatAlias);
router.post('/:id/team-placement/preview', protectedRoute('admin', 'org', 'organization', { profile: true }), previewTeamPlacement);
router.post('/:id/team-placement/confirm', protectedRoute('admin', 'org', 'organization', { profile: true }), confirmTeamPlacement);
router.get('/:id/wildcard/candidates', protectedRoute('admin', 'org', 'organization', { profile: true }), getWildcardCandidates);
router.post('/:id/wildcard/preview', protectedRoute('admin', 'org', 'organization', { profile: true }), previewWildcard);
router.post('/:id/wildcard/confirm', protectedRoute('admin', 'org', 'organization', { profile: true }), confirmWildcard);
router.get('/single', getAllSingleSportTournaments);
router.get('/multi/:id', getTournamentById);
router.get('/single/:id/export/pdf', protectedRoute('admin', 'org', 'organization', { profile: true }), exportSingleTournamentPdf);
router.get('/single/:id', getSingleTournamentById);

// ========== GET BY ORGANIZATION ==========
router.get('/my/single', protectedRoute(), getSingleSportTournamentsByOrganization);
router.get('/my/multi', protectedRoute(), getTournamentByOrganization);

// ========== CREATE ==========
router.post('/single', protectedRoute('admin', 'org', 'organization', { profile: true }), createSingleSportTournament);
router.post('/multi', protectedRoute('admin', 'org', 'organization', { profile: true }), createMultiSportTournament);

// ========== UPDATE ==========
router.put('/single/:id', protectedRoute('admin', 'org', 'organization', { profile: true }), updateSingleSportTournament);
router.put('/multi/:id', protectedRoute('admin', 'org', 'organization', { profile: true }), updateMultiSportTournament);

// ========== DELETE ==========
router.delete('/single/:id', protectedRoute('admin', 'org', 'organization', { profile: true }), softDeleteSingleTournament);
router.delete('/multi/:id', protectedRoute('admin', 'org', 'organization', { profile: true }), softDeleteMultiTournament);

// ========== CHANGE STATUS ==========
router.patch('/single/:id/status', protectedRoute('admin', 'org', 'organization', { profile: true }), changeSingleStatus);
router.patch('/multi/:id/status', protectedRoute('admin', 'org', 'organization', { profile: true }), changeMultiStatus);

export default router;
