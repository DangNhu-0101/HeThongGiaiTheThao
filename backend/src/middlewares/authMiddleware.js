import jwt from 'jsonwebtoken';
import User from '../models/users.js';

/**
 * Middleware xác thực và phân quyền.
 * @param  {...string} allowedRoles - Danh sách các role name được phép (ví dụ: 'admin', 'org')
 * @returns {Function} Express middleware
 */
export const protectedRoute = (...args) => {
    return async (req, res, next) => {
        try {
            const allowedRoles = args.flat();
            // 1. Lấy token từ cookie hoặc Authorization header
            let token = req.cookies?.jwt || req.cookies?.accessToken;
            const authHeader = req.headers['authorization'];
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.slice(7);
            }

            if (!token) {
                return res.status(401).json({ message: "Không tìm thấy token xác thực" });
            }

            // 2. Giải mã token, lấy userId
            let decoded;
            try {
                decoded = jwt.verify(token, process.env.ACCESS_TOKEN);
            } catch (err) {
                console.error("JWT verify error:", err.message);
                return res.status(403).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
            }

            if (!decoded.userId) {
                return res.status(401).json({ message: "Token thiếu thông tin userId" });
            }

            // 3. Tìm user trong DB, lấy thông tin roles (có thể populate hoặc dùng roleNames)
            const user = await User.findById(decoded.userId)
                .select('-hashedPassword') // không trả mật khẩu
                .populate('roles', 'name'); // nếu bạn dùng tham chiếu và muốn lấy chi tiết

            if (!user) {
                return res.status(404).json({ message: "Người dùng không tồn tại" });
            }

            // 4. Lấy danh sách tên role (hỗ trợ cả single role cũ và mảng roles mới)
            let userRoleNames = [];
            if (Array.isArray(user.roles) && user.roles.length > 0) {
                // Trường hợp mới: user.roles là mảng các ObjectId hoặc đã populate
                userRoleNames = user.roles.map(role => typeof role === 'object' ? role.name : role);
            } else if (user.role) {
                // Trường hợp cũ (single role) - để tương thích ngược
                userRoleNames = [user.role];
            } else if (user.roleName) {
                // Trường hợp có denormalized roleName (single)
                userRoleNames = [user.roleName];
            }

            // 5. Kiểm tra quyền: nếu allowedRoles không rỗng thì user phải có ít nhất 1 role trong đó
            if (allowedRoles.length > 0) {
                const hasRequiredRole = userRoleNames.some(roleName => allowedRoles.includes(roleName));
                if (!hasRequiredRole) {
                    return res.status(403).json({
                        message: `Bạn không có quyền thực hiện hành động này. Yêu cầu các role: ${allowedRoles.join(', ')}`
                    });
                }
            }

            // 6. Gắn user object vào req để sử dụng ở các middleware/controller sau
            req.user = user;
            req.userRoleNames = userRoleNames; // optional, tiện dùng

            next();
        } catch (error) {
            console.error("Lỗi trong protectedRoute:", error);
            return res.status(500).json({ message: "Lỗi hệ thống khi xác thực" });
        }
    };
};