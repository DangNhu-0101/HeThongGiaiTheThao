import express from 'express';
import { getCourtsByTournament, addCourt, toggleCourtStatus } from '../controllers/courtController.js';

const router = express.Router();

router.get('/tournament/:tournamentId', getCourtsByTournament);
router.post('/add', addCourt);
router.patch('/:courtId/status', toggleCourtStatus);

export default router;