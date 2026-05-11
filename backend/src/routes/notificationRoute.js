import express from 'express';
import { getMyNotifications, deleteNotification } from '../controllers/notificationController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Lấy thông báo của chính người đang đăng nhập
router.delete('/:id', protectedRoute(), deleteNotification);
router.get('/me', protectedRoute(), getMyNotifications);


export default router;