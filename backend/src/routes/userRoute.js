// routes/userRoutes.js
import express from 'express';
import { protectedRoute } from '../middlewares/authMiddleware.js';
import {
    authMe,
    getProfile,
    editProfile,
    changePassword,
    searchUsers,
    requestRole,
    createPlayerProfile,
    updateOrganization,
    updatePlayer,
    updateReferee
} from '../controllers/userController.js';

const router = express.Router();

router.get('/me', protectedRoute(), authMe);
router.get('/profile', protectedRoute(), getProfile);
router.put('/profile', protectedRoute(), editProfile);
router.put('/change-password', protectedRoute(), changePassword);
router.get('/search', protectedRoute(), searchUsers);
router.post('/request-role', protectedRoute(), requestRole);
router.post('/create-player', protectedRoute(), createPlayerProfile);
router.put('/update-org', protectedRoute(), updateOrganization);
router.put('/update-player', protectedRoute(), updatePlayer);
router.put('/update-referee', protectedRoute(), updateReferee);

export default router;