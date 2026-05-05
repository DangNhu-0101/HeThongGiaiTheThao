import express from 'express';
import { protectedRoute } from '../middlewares/authMiddleware.js';
import { 
    createTeam,
    getTeamDetail,
    getAllTeam,
    sendInvitation,
    acceptInvitation,
    rejectInvitation,
    getTeamsByTournament,
    getUserInvitations
 } from '../controllers/teamContoller.js';

const route = express.Router();

route.get('/all', getAllTeam);
route.get('/getTeamDetail/:id', getTeamDetail);
route.get('/tournament/:tournamentId', getTeamsByTournament);
route.get('/invitations/my', protectedRoute(['Player']), getUserInvitations);

route.post('/createTeam',protectedRoute(['Player']), createTeam);

route.post('/requests', protectedRoute(['Player','Orgnization']), sendInvitation);
route.patch('/requests/:requestId/accept', protectedRoute(['Player', 'Referee']), acceptInvitation);
route.patch('/requests/:requestId/reject', protectedRoute(['Player', 'Referee']), rejectInvitation)
export default route;