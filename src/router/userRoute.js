// routes/userRoutes.js
import express from 'express';
import {
    authMe,
    completeUser,
    getAllUsers,
    searchUsers,
    changePassword,
    getProfile,
    editProfile
} from '../controllers/userController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();


// Lấy thông tin user từ token (auth/me)
router.get('/me', protectedRoute('player', 'refeere', 'org'), authMe);

// Hoàn tất đăng ký hồ sơ (player, referee, org)
router.post('/complete', protectedRoute('player','refeere','org'), completeUser);

// Lấy danh sách tất cả users (có thể chỉ dành cho admin)
router.get('/', protectedRoute('org') ,getAllUsers);

// Tìm kiếm users (theo email, displayName) - chỉ trả về player
router.get('/search', protectedRoute('player', 'org'), searchUsers);

// Đổi mật khẩu
router.post('/change-password', protectedRoute('player', 'refeere', 'org') ,changePassword);

// Lấy profile chi tiết (kèm thông tin role-specific)
router.get('/profile', protectedRoute('player', 'refeere', 'org'), getProfile);

// Cập nhật profile (cả user chung và role-specific)
router.put('/profile', protectedRoute('player', 'refeere', 'org'), editProfile);

export default router;