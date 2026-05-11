import express from 'express';
import multer from 'multer'; // 1. IMPORT MULTER
import path from 'path';
import fs from 'fs';
import {
   getAllTournament,
   createTournament,
   getTournament,
   editTournament,
   cancelTournament
} from '../controllers/tournamentController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const route = express.Router();

// 2. CẤU HÌNH MULTER ĐỂ LƯU ẢNH (Lưu vào thư mục uploads/ ở Backend)
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir); // Tự động tạo thư mục nếu chưa có
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, `tour-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage: storage });

// 3. KHAI BÁO CÁC TRƯỜNG ẢNH SẼ NHẬN TỪ FRONTEND
const cpUpload = upload.fields([
    { name: 'logo', maxCount: 1 }, 
    { name: 'banner', maxCount: 1 }, 
    { name: 'paymentQR', maxCount: 1 }
]);

// 4. CHÈN cpUpload VÀO GIỮA ROUTE CREATE VÀ EDIT
route.get('/getAllTournament',  getAllTournament);

route.post('/createTournament', protectedRoute(['Organization']), cpUpload, createTournament);

route.get('/getTournament/:id',  getTournament);

route.patch('/editTournament/:id', protectedRoute(['Organization']), cpUpload, editTournament);

route.delete('/cancelTournament/:id', protectedRoute(['Organization']), cancelTournament);

export default route;