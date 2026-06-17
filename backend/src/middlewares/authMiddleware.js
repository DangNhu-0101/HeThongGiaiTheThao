import jwt from 'jsonwebtoken';
import User from '../models/users.js';

export const protectedRoute = (...args) => {
    return async (req, res, next) => {
        try {
            const allowedRoles = args.flat();

            // 1. Lấy token
            let token = req.cookies?.jwt || req.cookies?.accessToken;
            const authHeader = req.headers['authorization'];
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.slice(7);
            }

            if (!token) {
                return res.status(401).json({ message: "Không tìm thấy token xác thực" });
            }

            // 2. Verify token
            let decoded;
            try {
                decoded = jwt.verify(token, process.env.ACCESS_TOKEN);
            } catch (err) {
                return res.status(403).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
            }

            if (!decoded.userId) {
                return res.status(401).json({ message: "Token thiếu thông tin userId" });
            }

            // 3. Tìm user và populate roles
            const user = await User.findById(decoded.userId)
                .select('-hashedPassword')
                .populate('roles', 'name');

            if (!user) {
                return res.status(404).json({ message: "Người dùng không tồn tại" });
            }

            // 4. Lấy danh sách tên role
            let userRoleNames = [];
            if (user.roles && user.roles.length > 0) {
                userRoleNames = user.roles.map(role => role.name); // role đã được populate, có trường name
            } else if (user.roles) {
                userRoleNames = [user.roles];
            } else if (user.roles) {
                userRoleNames = [user.roleName];
            }

            // 5. Kiểm tra quyền
            if (allowedRoles.length > 0) {
                const hasRequiredRole = userRoleNames.some(roleName => allowedRoles.includes(roleName));
                if (!hasRequiredRole) {
                    return res.status(403).json({
                        message: `Bạn không có quyền thực hiện hành động này. Yêu cầu các role: ${allowedRoles.join(', ')}`
                    });
                }
            }

            // 6. Gán user vào req
            req.user = user;
            req.userRoleNames = userRoleNames;

            next();
        } catch (error) {
            console.error("Lỗi trong protectedRoute:", error);
            return res.status(500).json({ message: "Lỗi hệ thống khi xác thực" });
        }
    };
};