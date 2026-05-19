import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { importExcel } from '../controllers/xlxsController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

// Route tải file mẫu - KHÔNG CẦN AUTH ĐỂ TEST
router.get('/template', (req, res) => {
    const templatePath = path.join(__dirname, '../templates/import_template.xlsx');
    
    console.log('Template path:', templatePath);
    
    // Kiểm tra file tồn tại
    if (!fs.existsSync(templatePath)) {
        console.error('File not found:', templatePath);
        return res.status(404).json({ success: false, message: 'File template không tồn tại' });
    }
    
    // Set headers cho file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="import_template.xlsx"');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    
    // Gửi file
    res.download(templatePath, 'import_template.xlsx', (err) => {
        if (err) {
            console.error('Download error:', err);
            res.status(500).json({ success: false, message: 'Lỗi khi tải file' });
        } else {
            console.log('File downloaded successfully');
        }
    });
});

router.post('/import', protectedRoute('org'), upload.single('file'), importExcel);

export default router;