import express from 'express';
import { protectedRoute } from '../middlewares/authMiddleware.js';
import { getPublicSettings, updateSystemSettings } from '../controllers/systemSettingsController.js';

const router = express.Router();

router.get('/public', getPublicSettings);
router.put('/admin', protectedRoute('admin'), updateSystemSettings);

export default router;
