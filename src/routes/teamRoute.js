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
    acceptInvitation,
    rejectInvitation,
    getTeamsByTournament,
    getUserInvitations,
    getSentInvitations,
    cancelInvitation,
    updateTeam,
    deleteTeam,
    removeMember
 } from '../controllers/teamController.js';

const route = express.Router();

route.get('/all', protectedRoute(['Player', 'Organization', 'Referee']), getAllTeam);
route.get('/getTeamDetail/:id', getTeamDetail);
route.get('/tournament/:tournamentId', getTeamsByTournament);
route.get('/invitations/my', protectedRoute(['Player']), getUserInvitations);
route.post('/register-flow', protectedRoute(['Player']), registerFlow);route.post('/createTeam',protectedRoute(['Player']), createTeam);

route.get('/sent-invitations', protectedRoute(['Player']), getSentInvitations);
route.get('/received-invitations', protectedRoute(['Player', 'Organization']), getReceivedInvitations);

route.post('/respond-invitation', protectedRoute(['Player', 'Organization']), respondInvitation);
route.delete('/cancel-invitation/:memberRecordId', protectedRoute(['Player']), cancelInvitation);
route.post('/requests', protectedRoute(['Player','Orgnization']), sendInvitation);

route.patch('/requests/:requestId/accept', protectedRoute(['Player', 'Referee']), acceptInvitation);
route.patch('/requests/:requestId/reject', protectedRoute(['Player', 'Referee']), rejectInvitation)
route.get('/detail/:id', protectedRoute(['Player', 'Organization', 'Referee']), getTeamDetail);

route.patch('/update/:id', protectedRoute(['Player']), updateTeam);
route.delete('/delete/:id', protectedRoute(['Player']), deleteTeam);
route.delete('/remove-member/:memberRecordId', protectedRoute(['Player']), removeMember);
export default route;