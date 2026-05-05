import express from 'express';

import { authMe, changePassword, completeUser, editProfile, getProfile, getAllUsers, searchUsers } from '../controllers/userControler.js'; 
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public (Dùng cho tìm kiếm hoặc admin công khai)
router.get('/all', getAllUsers);

router.get('/search', protectedRoute(['Player']), searchUsers);

// Private - Yêu cầu Token
router.get('/me', protectedRoute(), authMe); 

router.post('/completeUser', protectedRoute(), completeUser);

router.patch('/changePassword', protectedRoute(['Player', 'Referee', 'Organization']), changePassword);

router.get('/getprofile', protectedRoute(['Player', 'Referee', 'Organization']), getProfile);

router.patch('/editProfile', protectedRoute(['Player', 'Referee', 'Organization']), editProfile);

export default router;