

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { importExcel, exportExcel } from '../controllers/xlxsController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';


const __filename = fileURLToPath(import.meta.url);  // Thêm dòng này
const __dirname = path.dirname(__filename);


const upload = multer({ dest: 'uploads/' });
const router = express.Router();




router.post('/import', protectedRoute('org, Organization'), upload.single('file'), importExcel);
router.get('/template', protectedRoute('org, Organization'), exportExcel);
router.get('/template/:type', protectedRoute('org, Organization'), exportExcel);
router.get('/export', protectedRoute('org, Organization'), exportExcel);
router.get('/export/:type', protectedRoute('org, Organization'), exportExcel);
export default router;



