import express from 'express';
import { protectedRoute } from '../middlewares/authMiddleware.js';
import {
    deleteAllNotifications,
    deleteNotification,
    listNotifications,
    markAllNotificationsRead,
    markNotificationRead
} from '../controllers/notificationController.js';

const router = express.Router();

router.get('/', protectedRoute(), listNotifications);
router.patch('/read-all', protectedRoute(), markAllNotificationsRead);
router.delete('/all', protectedRoute(), deleteAllNotifications);
router.patch('/:id/read', protectedRoute(), markNotificationRead);
router.delete('/:id', protectedRoute(), deleteNotification);

export default router;
