// routes/userRoutes.js
import express from 'express';
import { protectedRoute } from '../middlewares/authMiddleware.js';
import {
    authMe,
    getProfile,
    editProfile,
    changePassword,
    requestChangePasswordOtp,
    verifyChangePasswordOtp,
    confirmChangePassword,
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
router.post('/change-password/request-otp', protectedRoute(), requestChangePasswordOtp);
router.post('/change-password/verify-otp', protectedRoute(), verifyChangePasswordOtp);
router.post('/change-password/confirm', protectedRoute(), confirmChangePassword);
router.get('/search', protectedRoute(), searchUsers);
router.post('/request-role', protectedRoute(), requestRole);
router.post('/create-player', protectedRoute(), createPlayerProfile);
router.put('/update-org', protectedRoute(), updateOrganization);
router.put('/update-player', protectedRoute(), updatePlayer);
router.put('/update-referee', protectedRoute(), updateReferee);

export default router;
