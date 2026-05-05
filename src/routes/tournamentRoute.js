import express from 'express';
import {
   getAllTournament,
   createTournament,
   getTournament,
   editTournament,
   cancelTournament
} from '../controllers/tournamentController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const route = express.Router();

route.get('/getAllTournament',  getAllTournament);
route.post('/createTournament', protectedRoute(['Organization']), createTournament);
route.get('/getTournament/:id',  getTournament);
route.patch('/editTournament/:id', protectedRoute(['Organization']), editTournament);
route.delete('/cancelTournament/:id', protectedRoute(['Organization']), cancelTournament);

export default route;