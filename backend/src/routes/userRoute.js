import express from 'express';
import { approveRoleRequest, getUsers } from '../controllers/userController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protectedRoute('admin'), getUsers);
router.patch('/:id/role-request/approve', protectedRoute('admin'), approveRoleRequest);

export default router;
