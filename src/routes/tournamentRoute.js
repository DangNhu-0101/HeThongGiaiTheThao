import express from 'express';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import {
    getAllTournament,
    createTournament,
    editTournament,
    getTournament,
    cancelTournament
} from '../controllers/tournamentController.js';

import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });


// Các route công khai (không cần đăng nhập)
router.get('/', getAllTournament);               // Lấy danh sách giải đấu (phân trang, lọc)
router.get('/:id', getTournament);               // Lấy chi tiết giải đấu



// Tạo giải đấu mới (có upload file)
router.post('/createTournament', 
    protectedRoute('org, Organization'), 
    upload.fields([
        { name: 'logo', maxCount: 1 },
        { name: 'paymentQR', maxCount: 1 },
        { name: 'banners', maxCount: 10 } // Cho phép tối đa 10 ảnh banner
    ]), 
    createTournament
);

// Chỉnh sửa giải đấu (có upload file)
router.put('/:id', 
    protectedRoute('org, Organization'), 
    upload.fields([
        { name: 'logo', maxCount: 1 },
        { name: 'paymentQR', maxCount: 1 },
        { name: 'banners', maxCount: 10 }
    ]), 
    editTournament
);
// Hủy giải đấu (chuyển status thành cancelled)
router.put('/:id/cancel', protectedRoute('org, Organization'), cancelTournament);

export default router;