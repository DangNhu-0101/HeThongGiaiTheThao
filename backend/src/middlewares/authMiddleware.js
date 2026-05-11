import jwt from 'jsonwebtoken';
import User from '../models/users.js';

// Đổi thành function nhận allowedRoles
export const protectedRoute = (allowedRoles = []) => {
    return async (req, res, next) => {
        try {
            let token = req.cookies.jwt || req.cookies.accessToken;
            
            // Extract token from Authorization header (Bearer token)
            const authHeader = req.headers['authorization'];
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.slice(7); // Remove 'Bearer ' prefix
            }
            
            if (!token) {
                return res.status(401).json({ message: "Không tìm thấy Token" });
            }

            try {
                // Giải mã Token
                const decodedUser = jwt.verify(token, process.env.ACCESS_TOKEN);

                // Tìm user trong DB để đảm bảo user vẫn tồn tại và lấy Role mới nhất
                const user = await User.findById(decodedUser.userId).select('-hashedPassword');

                if (!user) {
                    return res.status(404).json({ message: "Người dùng không tồn tại" });
                }

                // KIỂM TRA QUYỀN (Nếu mảng allowedRoles không trống)
                if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
                    return res.status(403).json({
                        message: `Bạn không có quyền thực hiện hành động này. Yêu cầu quyền: ${allowedRoles}`
                    });
                }

                // Gán user vào req để các controller sau sử dụng
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