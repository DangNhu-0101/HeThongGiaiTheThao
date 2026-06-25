// routes/adminRoutes.js
import express from 'express';
import { protectedRoute } from '../middlewares/authMiddleware.js';
import {
    getPendingRequests,
    approveOrganization,
    approveReferee,
    rejectRequest,
    getUsers,
    getUserDetail,
    updateUserByAdmin,
    deleteUser
} from '../controllers/userController.js';

const router = express.Router();

// Quản lý user
router.get('/users', protectedRoute('admin'), getUsers);
router.get('/users/:id', protectedRoute('admin'), getUserDetail);
router.put('/users/:id', protectedRoute('admin'), updateUserByAdmin);
router.delete('/users/:id', protectedRoute('admin'), deleteUser);

// Quản lý yêu cầu role
router.get('/requests/pending', protectedRoute('admin'), getPendingRequests);
router.patch('/requests/org/:id/approve', protectedRoute('admin'), approveOrganization);
router.patch('/requests/referee/:id/approve', protectedRoute('admin'), approveReferee);
router.delete('/requests/:type/:id/reject', protectedRoute('admin'), rejectRequest);

export default router;