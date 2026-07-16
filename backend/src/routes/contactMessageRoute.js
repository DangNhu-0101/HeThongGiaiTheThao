import express from 'express';
import { protectedRoute } from '../middlewares/authMiddleware.js';
import {
    createContactMessage,
    deleteContactMessage,
    listContactMessages,
    updateContactMessageStatus
} from '../controllers/contactMessageController.js';

const router = express.Router();

router.post('/', createContactMessage);
router.get('/admin', protectedRoute('admin'), listContactMessages);
router.patch('/admin/:id', protectedRoute('admin'), updateContactMessageStatus);
router.delete('/admin/:id', protectedRoute('admin'), deleteContactMessage);

export default router;
