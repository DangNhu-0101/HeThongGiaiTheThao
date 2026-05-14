// routes/userRoutes.js
import express from 'express';
import {
    authMe,
    getAllUsers,
    searchUsers,
    changePassword,
    getProfile,
    editProfile,
    getAllOrganizations
} from '../controllers/userController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

// --- NHỮNG ROUTE DÙNG CHUNG (Chỉ cần đăng nhập là vào được) ---
// Bỏ các tham số role đi, chỉ để protectedRoute() là đủ

// Lấy thông tin user từ token (auth/me)
router.get('/me', protectedRoute(), authMe); 

// Đổi mật khẩu
router.post('/change-password', protectedRoute(), changePassword);

// Lấy profile chi tiết
router.get('/profile', protectedRoute(), getProfile);

// Cập nhật profile
router.put('/profile', protectedRoute(), editProfile);


// --- NHỮNG ROUTE PHÂN QUYỀN CỤ THỂ ---

// Lấy danh sách tất cả users (Giả sử chỉ Organization mới xem được)
router.get('/', protectedRoute('Organization'), getAllUsers);

// Tìm kiếm users
router.get('/search', protectedRoute('player', 'referee', 'Organization'), searchUsers);

router.get('/organizations', getAllOrganizations);

export default router;