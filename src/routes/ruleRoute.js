import express from 'express';
import { getAllRules, getDetailRules, editRule, deleteRule, createRules } from '../controllers/ruleController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const route = express.Router();
route.get('/all', protectedRoute(['Organization']), getAllRules);
route.post('/create', protectedRoute(['Organization']), async (req, res) => {
    try {
        const { tournamentId, ...ruleData } = req.body;
        const result = await createRules([ruleData], tournamentId); 
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});route.get('/getDetailRules/:id', protectedRoute(['Player', 'Referee', 'Organization']), getDetailRules);
route.patch('/editRule/:id', protectedRoute(['Organization']), editRule);
route.delete('/deleteRule/:id', protectedRoute(['Organization']), deleteRule);

export default route;