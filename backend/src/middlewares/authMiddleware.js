// middlewares/authMiddleware.js
import jwt from 'jsonwebtoken';
import User from '../models/users.js';
import Organization from '../models/orgs.js';
import Player from '../models/players.js';
import Referee from '../models/referees.js';

// Cấu hình profile cho từng loại
const PROFILE_CONFIG = {
    organization: {
        model: Organization,
        validStatus: ['actived', 'active'], // chuẩn hóa
        errorMessage: 'Bạn chưa có profile tổ chức hợp lệ. Vui lòng tạo tổ chức và chờ duyệt.',
        notFoundMessage: 'Bạn chưa có profile tổ chức. Vui lòng tạo tổ chức trước.'
    },
    player: {
        model: Player,
        validStatus: ['active', 'actived'],
        errorMessage: 'Profile cầu thủ của bạn chưa được kích hoạt.',
        notFoundMessage: 'Bạn chưa có profile cầu thủ. Vui lòng tạo profile cầu thủ trước.'
    },
    referee: {
        model: Referee,
        validStatus: ['actived', 'active'],
        errorMessage: 'Profile trọng tài của bạn chưa được duyệt hoặc đã bị từ chối.',
        notFoundMessage: 'Bạn chưa có profile trọng tài. Vui lòng tạo profile trọng tài và chờ duyệt.'
    }
};

export const protectedRoute = (...args) => {
    return async (req, res, next) => {
        try {
            // Phân tích tham số
            let allowedRoles = [];
            let options = { profile: false, allowAdminSkip: true };

            for (const arg of args) {
                if (typeof arg === 'string') {
                    allowedRoles.push(arg);
                } else if (typeof arg === 'object' && !Array.isArray(arg)) {
                    options = { ...options, ...arg };
                }
            }

            // 1. Lấy token từ cookie hoặc header
            let token = req.cookies?.jwt || req.cookies?.accessToken;
            const authHeader = req.headers['authorization'];
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.slice(7);
            }

            if (!token) {
                return res.status(401).json({ success: false, message: 'Không tìm thấy token xác thực' });
            }

            // 2. Verify token
            let decoded;
            try {
                decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || 'your_access_secret');
            } catch (err) {
                return res.status(403).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
            }

            if (!decoded.userId) {
                return res.status(401).json({ success: false, message: 'Token thiếu userId' });
            }

            // 3. Tìm user và populate roles
            const user = await User.findById(decoded.userId)
                .select('-hashedPassword')
                .populate('roles', 'name');

            if (!user) {
                return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
            }

            // Lấy danh sách role name
            const userRoleNames = user.roles.map(role => role.name);
            const isAdmin = userRoleNames.includes('admin');

            // 4. Kiểm tra role (nếu có yêu cầu)
            if (allowedRoles.length > 0) {
                const hasRequiredRole = userRoleNames.some(role => allowedRoles.includes(role));
                if (!hasRequiredRole) {
                    return res.status(403).json({
                        success: false,
                        message: `Yêu cầu các role: ${allowedRoles.join(', ')}`
                    });
                }
            }

            // 5. Kiểm tra profile (nếu có yêu cầu)
            if (options.profile) {
                // Xác định profileType
                let profileType = null;

                if (typeof options.profile === 'string') {
                    // Nếu truyền trực tiếp tên profile: 'organization', 'player', 'referee'
                    profileType = options.profile;
                } else {
                    // Tự động suy luận từ allowedRoles (ưu tiên: admin/org -> organization, referee -> referee, player -> player)
                    const priorityMap = {
                        'org': 'organization',
                        'admin': 'organization', // admin có thể coi như organization nếu cần
                        'player': 'player',
                        'referee': 'referee'
                    };
                    for (const role of allowedRoles) {
                        if (priorityMap[role]) {
                            profileType = priorityMap[role];
                            break;
                        }
                    }
                    // Nếu vẫn chưa có và user có role, lấy role đầu tiên
                    if (!profileType && userRoleNames.length > 0) {
                        const firstRole = userRoleNames[0];
                        if (priorityMap[firstRole]) {
                            profileType = priorityMap[firstRole];
                        }
                    }
                }

                // Nếu không xác định được profileType, bỏ qua check (có thể log warning)
                if (!profileType) {
                    console.warn('Không xác định được profileType để kiểm tra, bỏ qua.');
                    // Gán user và cho đi tiếp
                    req.user = user;
                    req.userRoles = userRoleNames;
                    return next();
                }

                // Admin có thể bỏ qua kiểm tra profile nếu được phép
                if (options.allowAdminSkip && isAdmin) {
                    req.user = user;
                    req.userRoles = userRoleNames;
                    req.profile = null;
                    req.profileType = profileType;
                    return next();
                }

                // Lấy config cho profileType
                const config = PROFILE_CONFIG[profileType];
                if (!config) {
                    return res.status(500).json({
                        success: false,
                        message: `Cấu hình profile không hợp lệ: ${profileType}`
                    });
                }

                // Tìm profile trong DB
                let profile;
                if (profileType === 'organization') {
                    profile = await config.model.findOne({ ownerId: user._id });
                } else if (profileType === 'player' || profileType === 'referee') {
                    profile = await config.model.findOne({ userId: user._id });
                } else {
                    // fallback generic
                    profile = await config.model.findOne({ userId: user._id });
                }

                if (!profile) {
                    return res.status(403).json({
                        success: false,
                        message: config.notFoundMessage || 'Profile không tồn tại.',
                        needCreate: true,
                        profileType,
                        redirectTo: `/profile/create/${profileType}`
                    });
                }

                // Kiểm tra status profile có hợp lệ không
                if (!config.validStatus.includes(profile.status)) {
                    return res.status(403).json({
                        success: false,
                        message: config.errorMessage || `Profile ${profileType} đang ở trạng thái: ${profile.status}`,
                        needCreate: false,
                        profileType,
                        currentStatus: profile.status
                    });
                }

                // Gắn profile vào req
                req.profile = profile;
                req.profileType = profileType;
            }

            // Gắn user và roles vào req
            req.user = user;
            req.userRoles = userRoleNames;
            next();

        } catch (error) {
            console.error('Lỗi trong protect middleware:', error);
            return res.status(500).json({ success: false, message: 'Lỗi hệ thống khi xác thực' });
        }
    };
};


export const requireRoles = (...roles) => {
    return protect(...roles);
};


export const requireProfile = (profileType, options = {}) => {
    return protect({ profile: profileType, ...options });
};

export const requireRoleAndProfile = (role, profileType, options = {}) => {
    return protect(role, { profile: profileType, ...options });
};