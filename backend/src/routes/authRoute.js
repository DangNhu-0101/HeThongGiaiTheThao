import express from 'express';
import {
    register,
    login,
    logout,
    requestPasswordReset,
    verifyPasswordResetCode,
    resetPassword
} from '../controllers/authController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js'

const router = express.Router();

// Đăng ký tài khoản
router.post('/register', register);

// Đăng nhập
router.post('/login', login);

// Đăng xuất
router.post('/logout', protectedRoute(), logout);

router.post('/forgot-password/request', requestPasswordReset);
router.post('/forgot-password/verify', verifyPasswordResetCode);
router.post('/forgot-password/reset', resetPassword);

export default router;
