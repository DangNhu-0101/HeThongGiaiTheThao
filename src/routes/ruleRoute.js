import express from 'express';
import { 
    getAllRules, 
    getDetailRules, 
    editRule, 
    deleteRule, 
    getRuleSystems,
    saveTournamentStages // 👈 1. IMPORT HÀM NÀY VÀO
} from '../controllers/ruleController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const route = express.Router();

// Lấy danh sách Sách giáo khoa (JSON seed)
route.get('/systems', getRuleSystems); 

// 👉 2. THÊM ĐƯỜNG DẪN LƯU STAGES NÀY VÀO ĐÂY:
route.post('/save-stages/:tournamentId', protectedRoute(['Organization']), saveTournamentStages);

// Quản lý Rule riêng của từng giải đấu
route.get('/all', protectedRoute(['Organization']), getAllRules);
route.get('/getDetailRules/:id', protectedRoute(['Player', 'Referee', 'Organization']), getDetailRules);
route.patch('/editRule/:id', protectedRoute(['Organization']), editRule);
route.delete('/deleteRule/:id', protectedRoute(['Organization']), deleteRule);

export default route;