import express from 'express';
import { protectedRoute } from '../middlewares/authMiddleware.js';
import { exportOrgReportPdf } from '../controllers/reportController.js';

const router = express.Router();

router.post('/org/pdf', protectedRoute('admin', 'org', 'organization', { profile: true }), exportOrgReportPdf);

export default router;
