import express from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../../uploads/media');

fs.mkdirSync(uploadDir, { recursive: true });

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname || '').toLowerCase();
        const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (!allowedMimeTypes.has(file.mimetype)) {
            cb(new Error('Chỉ hỗ trợ ảnh JPG, JPEG, PNG hoặc WEBP.'));
            return;
        }
        cb(null, true);
    },
});

const router = express.Router();

router.post('/image', protectedRoute(), (req, res) => {
    upload.single('image')(req, res, (error) => {
        if (error) {
            return res.status(400).json({ success: false, message: error.message || 'Không thể tải ảnh lên.' });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn một tệp ảnh hợp lệ.' });
        }
        const relativeUrl = `/uploads/media/${req.file.filename}`;
        const absoluteUrl = `${req.protocol}://${req.get('host')}${relativeUrl}`;
        return res.status(201).json({ success: true, data: { url: absoluteUrl, path: relativeUrl } });
    });
});

export default router;
