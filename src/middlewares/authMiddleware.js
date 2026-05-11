import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protectedRoute = (allowedRoles = []) => {
    return async (req, res, next) => {
        try {
            let token = "";

            // 1. Ưu tiên lấy Token từ Header (Vì Frontend của bạn đang gửi Bearer)
            const authHeader = req.headers['authorization'] || req.headers['Authorization'];
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1]; 
            } 
            // 2. Nếu không có ở Header, tìm ở Cookie
            else {
                token = req.cookies?.jwt || req.cookies?.accessToken;
            }

            if (!token) {
                return res.status(401).json({ success: false, message: "Bạn chưa đăng nhập (Không tìm thấy Token)" });
            }

            try {
                // GIẢI MÃ TOKEN
                // Lưu ý: Đảm bảo process.env.ACCESS_TOKEN khớp với chìa khóa lúc SIGN token ở hàm Login
                const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);

                // TRUY VẤN USER
                // 🕵️ KIỂM TRA KỸ: Lúc Login bạn lưu là { id } hay { userId }? 
                // Ở đây mình dùng thử cả 2 để tránh lỗi "undefined"
                const userId = decoded.userId || decoded.id; 

                if (!userId) {
                    return res.status(403).json({ success: false, message: "Token sai định dạng (Thiếu ID)" });
                }

                const user = await User.findById(userId).select('-hashedPassword');

                if (!user) {
                    return res.status(404).json({ success: false, message: "Tài khoản không còn tồn tại trên hệ thống" });
                }

                // KIỂM TRA QUYỀN (Roles)
                if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
                    return res.status(403).json({
                        success: false,
                        message: `Bạn không có quyền: [${user.role}]. Yêu cầu quyền: [${allowedRoles.join(' hoặc ')}]`
                    });
                }

                // GÁN USER VÀO REQ ĐỂ CONTROLLER SỬ DỤNG
                // Ép kiểu về Object thuần hoặc để nguyên Mongoose Document đều được
                req.user = user; 
                
                // Mẹo: Log ra để Như check trong Terminal xem nó có ra data chưa
                // console.log("✅ Auth Success cho user:", user.displayName);

                next();

            } catch (err) {
                console.error("❌ JWT Verify Error:", err.message);
                return res.status(401).json({ success: false, message: "Phiên đăng nhập hết hạn hoặc Token lỗi" });
            }
        } catch (error) {
            console.error("🔥 Lỗi hệ thống Middleware:", error);
            return res.status(500).json({ success: false, message: "Lỗi hệ thống server" });
        }
    };
};