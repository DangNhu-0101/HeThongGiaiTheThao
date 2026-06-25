import express from 'express';
import { register, login, logout } from '../controllers/authController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js'

const router = express.Router();

// Đăng ký tài khoản
router.post('/register', register);

// Đăng nhập
router.post('/login', login);

// Đăng xuất
router.post('/logout', protectedRoute(), logout);

export default router;