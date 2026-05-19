import express from 'express';
import multer from 'multer';
import path from 'path'; 
import { fileURLToPath } from 'url';
import { importExcel } from '../controllers/xlxsController.js';
import {protectedRoute} from '../middlewares/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);  // Thêm dòng này
const __dirname = path.dirname(__filename); 

const upload = multer({ dest: 'uploads/' });
const router = express.Router();


router.post('/import',protectedRoute('org'), upload.single('file'), importExcel);
router.get('/template', (req, res) => {  // Bỏ protectedRoute('org')
    const templatePath = path.join(__dirname, '../../templates/import_template.xlsx');
    res.download(templatePath, 'import_template.xlsx', (err) => {
        if (err) {
            console.error('Template download error:', err);
            res.status(404).json({ success: false, message: 'Không tìm thấy file template' });
        }
    });
});
export default router;
