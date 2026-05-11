import express from 'express';
import { 
    authMe, 
    changePassword, 
    completeUser, 
    editProfile, 
    getProfile, 
    getAllUsers, 
    searchUsers 
} from '../controllers/userController.js'; 
import { protectedRoute } from '../middlewares/authMiddleware.js';

// Nếu bạn muốn lấy danh sách đội ngay tại đây, hãy import từ teamController
// import { getAllTeam } from '../controllers/teamController.js'; 

const router = express.Router();

// ==========================================
// 1. PUBLIC ROUTES (Không cần đăng nhập)
// ==========================================
router.get('/all', getAllUsers);
router.get('/search', searchUsers); // Tìm kiếm thành viên để mời vào đội


// ==========================================
// 2. PRIVATE ROUTES (Yêu cầu Token)
// ==========================================

// Lấy thông tin tài khoản đang đăng nhập (dùng cho App.jsx / Header)
router.get('/me', protectedRoute(), authMe); 

// Hoàn thiện hồ sơ lần đầu (nếu có)
router.post('/completeUser', protectedRoute(), completeUser);

// Xem hồ sơ chi tiết (gồm Skill Level, thông tin thi đấu)
router.get('/getprofile', protectedRoute(['Player', 'Referee', 'Organization']), getProfile);

// Chỉnh sửa hồ sơ cá nhân
router.patch('/editProfile', protectedRoute(['Player', 'Referee', 'Organization']), editProfile);

// Đổi mật khẩu
router.patch('/changePassword', protectedRoute(['Player', 'Referee', 'Organization']), changePassword);


// ==========================================
// 3. TEAM MANAGEMENT (Quản lý đội từ phía User)
// ==========================================

// Endpoint này trả về thông tin user kèm danh sách đội họ tham gia
// Lưu ý: Đảm bảo hàm getProfile trong controller đã được viết để .populate('teams')
router.get('/my-teams', protectedRoute(['Player', 'Organization']), getProfile); 

export default router;