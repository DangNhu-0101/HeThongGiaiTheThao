

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




router.post('/import', protectedRoute('org'), upload.single('file'), importExcel);
router.get('/template', (req, res) => {
    const templatePath = path.join(__dirname, '../../src/templates/import_template.xlsx');
    console.log('Template path:', templatePath);
    // Kiểm tra file tồn tại
    if (!fs.existsSync(templatePath)) {
        console.error('File not found:', templatePath);
        return res.status(404).json({ success: false, message: 'File template not found' });
    }
    res.download(templatePath, 'import_template.xlsx', (err) => {
        if (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Error downloading file' });
        }
    });
});
router.get('/export', protectedRoute('org'), exportExcel);
export default router;



