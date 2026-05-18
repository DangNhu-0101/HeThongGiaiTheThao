import express from 'express';
import { registerFull, login, logout } from '../controllers/authController.js';

const router = express.Router();

// Đăng ký tài khoản
router.post('/register', registerFull);

// Đăng nhập
router.post('/login', login);

// Đăng xuất
router.post('/logout', logout);

export default router;