import jwt from 'jsonwebtoken';
import User from '../models/users.js';

// Đổi thành function nhận allowedRoles
export const protectedRoute = (...allowedRoles) => {  // ← ĐÃ DÙNG ...allowedRoles
    return async (req, res, next) => {
        try {
            let token = req.cookies.jwt || req.cookies.accessToken;
            
            const authHeader = req.headers['authorization'];
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.slice(7);
            }
            
            if (!token) {
                return res.status(401).json({ message: "Không tìm thấy Token" });
            }

            try {
                const decodedUser = jwt.verify(token, process.env.ACCESS_TOKEN);
                const user = await User.findById(decodedUser.userId).select('-hashedPassword');

                if (!user) {
                    return res.status(404).json({ message: "Người dùng không tồn tại" });
                }

                // Flatten mảng nếu cần (xử lý cả protectedRoute('player') và protectedRoute(['player', 'Organization']))
                const roles = allowedRoles.flat();
                
                if (roles.length > 0 && !roles.some(role => role.toLowerCase() === (user.role || '').toLowerCase())) {
                    return res.status(403).json({
                        message: `Bạn không có quyền. Yêu cầu: ${roles.join(', ')}`
                    });
                }

                req.user = user;
                next();

            } catch (err) {
                console.log("JWT Verify Error:", err.message);
                return res.status(403).json({ message: "Token không hợp lệ hoặc hết hạn" });
            }
        } catch (error) {
            console.error("Lỗi Middleware:", error);
            return res.status(500).json({ message: "Lỗi hệ thống trong Middleware" });
        }
    };
};