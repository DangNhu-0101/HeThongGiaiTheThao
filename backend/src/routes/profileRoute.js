// routes/profileRoutes.js
import express from 'express';
import {
    createProfileOrganization,
    createProfilePlayer,
    createProfileReferee,
    getMyOrganization,
    getMyPlayer,
    getMyReferee,
    updateProfileOrganization,
    updateProfilePlayer,
    updateProfileReferee
} from '../controllers/profileController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ==================== ORGANIZATION ====================
// Tạo profile tổ chức (yêu cầu role org)
router.post('/organization', protectedRoute('org'), createProfileOrganization);

// Lấy profile tổ chức của mình
router.get('/organization/my', protectedRoute('org'), getMyOrganization);

// Cập nhật profile tổ chức
router.put('/organization', protectedRoute('org'), updateProfileOrganization);

// ==================== PLAYER ====================
// Tạo profile cầu thủ (yêu cầu role player)
router.post('/player', protectedRoute('player'), createProfilePlayer);

// Lấy profile cầu thủ của mình
router.get('/player/my', protectedRoute('player'), getMyPlayer);

// Cập nhật profile cầu thủ
router.put('/player', protectedRoute('player'), updateProfilePlayer);

// ==================== REFEREE ====================
// Tạo profile trọng tài (yêu cầu role referee)
router.post('/referee', protectedRoute('referee'), createProfileReferee);

// Lấy profile trọng tài của mình
router.get('/referee/my', protectedRoute('referee'), getMyReferee);

// Cập nhật profile trọng tài
router.put('/referee', protectedRoute('referee'), updateProfileReferee);

export default router;