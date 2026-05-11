import express from 'express';
import Referee from '../models/referees.js';

const router = express.Router();

router.get('/all', async (req, res) => {
    try {
        const refs = await Referee.find();
        res.json({ data: refs });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

export default router;