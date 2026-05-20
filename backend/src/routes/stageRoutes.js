import express from 'express';
import { saveStages, getStages } from '../controllers/stageController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

// POST /api/stages/save-stages/:tournamentId
router.post('/save-stages/:tournamentId', protectedRoute('org, Organization'), saveStages);

// GET /api/stages/get-stages/:tournamentId
router.get('/get-stages/:tournamentId', getStages);

export default router;