import express from 'express';
import {
    approveRoleRequest,
    rejectRoleRequest,
    getRoleRequests,
    changePassword,
    getProfile,
    editProfile,
    authMe,
    searchUsers,
} from '../controllers/userController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ==================== ADMIN ROUTES ====================
// Lấy danh sách tất cả users (admin)
router.get('/admin/users', protectedRoute('admin'), getUsers);

// Lấy danh sách các yêu cầu role đang chờ duyệt (admin)
router.get('/admin/role-requests', protectedRoute('admin'), getRoleRequests);

// Duyệt yêu cầu role (admin)
router.put('/admin/role-requests/:id/approve', protectedRoute('admin'), approveRoleRequest);

// Từ chối yêu cầu role (admin)
router.put('/admin/role-requests/:id/reject', protectedRoute('admin'), rejectRoleRequest);

// ==================== USER ROUTES (yêu cầu đăng nhập) ====================
// Lấy thông tin auth (user hiện tại)
router.get('/me', protectedRoute(), authMe);

// Đổi mật khẩu
router.put('/change-password', protectedRoute(), changePassword);

// Lấy thông tin profile của user hiện tại
router.get('/profile', protectedRoute(), getProfile);

// Cập nhật profile (username, avatar, và thông tin chi tiết theo role)
router.put('/profile', protectedRoute(), editProfile);

// ==================== SEARCH (cho tất cả user đã đăng nhập) ====================
// Tìm kiếm users (có thể filter theo email/name)
// Bạn có thể đặt nó ở đây hoặc tách riêng
router.get('/search', protectedRoute(), searchUsers); // nếu export searchUsers từ controller

export default router;