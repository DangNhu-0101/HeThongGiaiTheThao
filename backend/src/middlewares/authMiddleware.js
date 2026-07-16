import jwt from 'jsonwebtoken';
import User from '../models/users.js';
import Organization from '../models/orgs.js';
import Player from '../models/players.js';
import Referee from '../models/referees.js';
import Session from '../models/session.js';

const ACCESS_TOKEN_TTL = '30m';
const REFRESH_TOKEN_TTL = 12 * 24 * 60 * 60 * 1000;

const signAccessToken = (userId) => jwt.sign(
    { userId },
    process.env.ACCESS_TOKEN_SECRET || 'your_access_secret',
    { expiresIn: ACCESS_TOKEN_TTL }
);

const setAccessTokenCookie = (res, accessToken) => {
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: REFRESH_TOKEN_TTL
    });
};

const resolveUserIdFromRefreshToken = async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) return null;

    const session = await Session.findOne({
        refreshToken,
        expiresAt: { $gt: new Date() }
    }).lean();
    if (!session?.userId) return null;

    const accessToken = signAccessToken(session.userId);
    setAccessTokenCookie(res, accessToken);
    res.setHeader('x-access-token', accessToken);
    return session.userId;
};

const PROFILE_CONFIG = {
    organization: {
        model: Organization,
        validStatus: ['actived', 'active'],
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

const normalizeRoleName = (value) => String(value || '').trim().toLowerCase();

const roleAliases = {
    admin: ['admin', 'administrator', 'superadmin', 'super-admin'],
    org: ['org', 'organization', 'organizer'],
    organization: ['org', 'organization', 'organizer'],
    player: ['player', 'athlete'],
    referee: ['referee'],
    coach: ['coach']
};

const roleMatches = (userRole, allowedRole) => {
    const normalizedAllowedRole = normalizeRoleName(allowedRole);
    const acceptedRoles = roleAliases[normalizedAllowedRole] || [normalizedAllowedRole];
    return acceptedRoles.includes(normalizeRoleName(userRole));
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

            // 1. Lấy token
            let token = req.cookies?.jwt || req.cookies?.accessToken;
            const authHeader = req.headers['authorization'];
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.slice(7);
            }

            let decoded = null;
            if (!token) {
                const refreshedUserId = await resolveUserIdFromRefreshToken(req, res);
                if (!refreshedUserId) {
                    return res.status(403).json({ success: false, message: 'Không tìm thấy token xac thuc' });
                }
                decoded = { userId: refreshedUserId };
            } else {
                // 2. Verify token
                try {
                    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || 'your_access_secret');
                } catch (err) {
                    const refreshedUserId = await resolveUserIdFromRefreshToken(req, res);
                    if (!refreshedUserId) {
                        return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn', code: 'TOKEN_EXPIRED' });
                    }
                    decoded = { userId: refreshedUserId };
                }
            }

            if (!decoded.userId) {
                return res.status(401).json({ success: false, message: 'Token không hợp lệ' });
            }

            // 3. Tìm user
            const user = await User.findById(decoded.userId)
                .select('-hashedPassword')
                .populate('roles', 'name');

            if (!user) {
                return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
            }

            const userRoleNames = user.roles.map(role => normalizeRoleName(role.name));
            const isAdmin = userRoleNames.includes('admin');

            // 4. Kiểm tra role
            if (allowedRoles.length > 0) {
                const hasRequiredRole = user.roles.some(role =>
                    allowedRoles.some(allowedRole => roleMatches(role.name, allowedRole))
                );
                if (!hasRequiredRole) {
                    console.log('BLOCKED: role check failed. userRoles:', userRoleNames, '| required:', allowedRoles);
                    return res.status(403).json({
                        success: false,
                        message: `Yêu cầu các role: ${allowedRoles.join(', ')}`
                    });
                }
            }

            // 5. Kiểm tra profile
            // Khai báo profileType trước khi dùng.
            let profileType = null;

            if (options.profile) {
                if (typeof options.profile === 'string') {
                    profileType = options.profile;
                } else {
                    const priorityMap = {
                        'org': 'organization',
                        'organization': 'organization',
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
                    if (!profileType && userRoleNames.length > 0) {
                        for (const role of userRoleNames) {
                            if (priorityMap[role]) {
                                profileType = priorityMap[role];
                                break;
                            }
                        }
                    }
                }

                console.log('=== PROFILE CHECK ===');
                console.log('profileType:', profileType);
                console.log('isAdmin:', isAdmin);
                console.log('userRoleNames:', userRoleNames);
                console.log('allowedRoles:', allowedRoles);

                if (!profileType) {
                    console.warn('Không xác định được profileType, bỏ qua check.');
                    req.user = user;
                    req.userRoles = userRoleNames;
                    return next();
                }

                if (options.allowAdminSkip && isAdmin) {
                    req.user = user;
                    req.userRoles = userRoleNames;
                    req.profile = null;
                    req.profileType = profileType;
                    return next();
                }

                const config = PROFILE_CONFIG[profileType];
                if (!config) {
                    return res.status(500).json({
                        success: false,
                        message: `Cấu hình profile không hợp lệ: ${profileType}`
                    });
                }

                let profile;
                if (profileType === 'organization') {
                    profile = await config.model.findOne({ ownerId: user._id });
                } else {
                    profile = await config.model.findOne({ userId: user._id });
                }

                console.log('Found profile:', profile);

                if (!profile) {
                    console.log('BLOCKED: profile not found');
                    return res.status(403).json({
                        success: false,
                        message: config.notFoundMessage,
                        needCreate: true,
                        profileType,
                        redirectTo: `/profile/create/${profileType}`
                    });
                }

                if (!config.validStatus.includes(profile.status)) {
                    console.log('BLOCKED: profile status invalid:', profile.status);
                    return res.status(403).json({
                        success: false,
                        message: config.errorMessage,
                        needCreate: false,
                        profileType,
                        currentStatus: profile.status
                    });
                }

                req.profile = profile;
                req.profileType = profileType;
            }

            req.user = user;
            req.userRoles = userRoleNames;
            next();

        } catch (error) {
            console.error('Lỗi trong protect middleware:', error);
            return res.status(500).json({ success: false, message: 'Lỗi hệ thống khi xác thực' });
        }
    };
};

export const requireRoles = (...roles) => protectedRoute(...roles);
export const requireProfile = (profileType, options = {}) => protectedRoute({ profile: profileType, ...options });
export const requireRoleAndProfile = (role, profileType, options = {}) => protectedRoute(role, { profile: profileType, ...options });
