import express from 'express';
import { protectedRoute } from '../middlewares/authMiddleware.js';
import { 
    createTeam,
    registerFlow,
    getTeamDetail,
    getAllTeam,
    sendInvitation,
    getReceivedInvitations,
    respondInvitation,
    getTeamsByTournament,
    getSentInvitations,
    cancelInvitation,
    updateTeam,
    deleteTeam,
    removeMember
 } from '../controllers/teamController.js';

const route = express.Router();

// ==========================================
// 1. QUERIES - LẤY THÔNG TIN
// ==========================================
route.get('/all', protectedRoute(['Player', 'Organization', 'Referee']), getAllTeam);
route.get('/detail/:id', protectedRoute(['Player', 'Organization', 'Referee']), getTeamDetail);
route.get('/tournament/:tournamentId', getTeamsByTournament);

// ==========================================
// 2. TEAM MANAGEMENT - QUẢN LÝ ĐỘI THI ĐẤU
// ==========================================
route.post('/register-flow', protectedRoute(['Player']), registerFlow);
route.post('/create', protectedRoute(['Player']), createTeam);
route.patch('/update/:id', protectedRoute(['Player']), updateTeam);
route.delete('/delete/:id', protectedRoute(['Player']), deleteTeam);
route.delete('/remove-member/:memberRecordId', protectedRoute(['Player']), removeMember);

// ==========================================
// 3. INVITATIONS - LỜI MỜI GIA NHẬP
// ==========================================
// Luồng gửi (Đội trưởng)
route.post('/invitations/send', protectedRoute(['Player', 'Organization']), sendInvitation);
route.get('/invitations/sent', protectedRoute(['Player']), getSentInvitations);
route.delete('/invitations/cancel/:memberRecordId', protectedRoute(['Player']), cancelInvitation);

// Luồng nhận (Thành viên)
route.get('/invitations/my', protectedRoute(['Player', 'Organization']), getReceivedInvitations);
route.post('/invitations/respond', protectedRoute(['Player', 'Organization']), respondInvitation); // Xử lý cả accept & reject

export default route;