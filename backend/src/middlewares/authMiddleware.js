// middlewares/authMiddleware.js
import jwt from 'jsonwebtoken';
import User from '../models/users.js';
import Organization from '../models/orgs.js';
import Player from '../models/players.js';
import Referee from '../models/referees.js';

const PROFILE_CONFIG = {
    organization: {
        model: Organization,
        validStatus: ['actived'],
        errorMessage: 'Bạn chưa có profile tổ chức. Vui lòng tạo tổ chức trước.'
    },
    player: {
        model: Player,
        validStatus: ['active'],
        errorMessage: 'Bạn chưa có profile cầu thủ. Vui lòng tạo profile cầu thủ trước.'
    },
    referee: {
        model: Referee,
        validStatus: ['actived'],
        errorMessage: 'Bạn chưa có profile trọng tài. Vui lòng tạo profile trọng tài trước.'
    }
};

export const protectedRoute = (...args) => {
    return async (req, res, next) => {
        try {
            // Tách tham số: roles và options
            let allowedRoles = [];
            let options = { profile: false, allowAdminSkip: true };

            for (const arg of args) {
                if (typeof arg === 'string') {
                    allowedRoles.push(arg);
                } else if (typeof arg === 'object' && !Array.isArray(arg)) {
                    options = { ...options, ...arg };
                }
            }

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

            // 4. Lấy danh sách role names
            let userRoleNames = [];
            if (user.roles && user.roles.length > 0) {
                userRoleNames = user.roles.map(role => role.name);
            }

            // 5. Kiểm tra quyền role
            if (allowedRoles.length > 0) {
                const hasRequiredRole = userRoleNames.some(roleName => allowedRoles.includes(roleName));
                if (!hasRequiredRole) {
                    return res.status(403).json({
                        success: false,
                        message: `Yêu cầu các role: ${allowedRoles.join(', ')}`
                    });
                }
            }

            // 6. Kiểm tra profile (nếu có yêu cầu)
            if (options.profile) {
                // Xác định profileType
                let profileType = null;

                // Nếu options.profile là string (ví dụ: 'organization'), dùng trực tiếp
                if (typeof options.profile === 'string') {
                    profileType = options.profile;
                } else {
                    // Tự động suy luận từ allowedRoles (ưu tiên: org > player > referee)
                    // Admin được coi là organization (nếu có)
                    const priorityMap = {
                        'org': 'organization',
                        'admin': 'organization',
                        'player': 'player',
                        'referee': 'referee'
                    };
                    for (const role of allowedRoles) {
                        if (priorityMap[role]) {
                            profileType = priorityMap[role];
                            break;
                        }
                    }
                }

                // Nếu vẫn không xác định được profileType, bỏ qua (không kiểm tra)
                if (!profileType) {
                    // Nếu không có role nào khớp, bỏ qua check profile
                    req.user = user;
                    req.userRoleNames = userRoleNames;
                    return next();
                }

                // Kiểm tra admin skip
                const isAdmin = userRoleNames.some(r => r === 'admin' || r === 'SUPER_ADMIN');
                if (options.allowAdminSkip && isAdmin) {
                    req.user = user;
                    req.userRoleNames = userRoleNames;
                    req.profile = null;
                    req.profileType = profileType;
                    return next();
                }

                // Kiểm tra profile
                const config = PROFILE_CONFIG[profileType];
                if (!config) {
                    return res.status(500).json({
                        success: false,
                        message: `Loại profile không hợp lệ: ${profileType}`
                    });
                }

                const profile = await config.model.findOne({ userId: user._id });
                if (!profile) {
                    return res.status(403).json({
                        success: false,
                        message: config.errorMessage,
                        needCreate: true,
                        profileType: profileType,
                        redirectTo: `/profile/create/${profileType}`
                    });
                }

                if (!config.validStatus.includes(profile.status)) {
                    return res.status(403).json({
                        success: false,
                        message: `Profile ${profileType} đang ở trạng thái: ${profile.status}`,
                        needCreate: false,
                        profileType: profileType,
                        currentStatus: profile.status
                    });
                }

                // Gắn profile vào req
                req.profile = profile;
                req.profileType = profileType;
            }

            // 7. Gán user vào req
            req.user = user;
            req.userRoleNames = userRoleNames;
            next();
        } catch (error) {
            console.error("Lỗi trong protectedRoute:", error);
            return res.status(500).json({ success: false, message: "Lỗi hệ thống khi xác thực" });
        }
    };
};