import express from 'express';
import Sponsor from '../models/Sponsors.js';

const router = express.Router();

router.get('/tournament/:tournamentId', async (req, res) => {
    try {
        const sponsors = await Sponsor.find({ tournamentId: req.params.tournamentId });
        res.json({ data: sponsors });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

export default router;