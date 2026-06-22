import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import Player from '../models/players.js';
import Organization from '../models/orgs.js';
import Role from '../models/roles.js';
import Session from '../models/session.js';
import User from '../models/users.js';

const REFRESH_TOKEN_TTL = 12 * 24 * 60 * 60 * 1000;
const REQUESTABLE_ROLES = new Set(['player', 'org', 'referee']);

const issueSession = async (userId) => {
    const accessToken = jwt.sign(
        { userId },
        process.env.ACCESS_TOKEN || 'SECRET_KEY_TAM_THOI',
        { expiresIn: '30m' }
    );
    const refreshToken = crypto.randomBytes(64).toString('hex');

    await Session.create({
        userId,
        refreshToken,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL)
    });

    return { accessToken, refreshToken };
};

const setRefreshCookie = (res, refreshToken) => {
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: REFRESH_TOKEN_TTL
    });
};

export const register = async (req, res) => {
    try {
        const { username, password, email, phoneNumber, role = 'player', profileData = {} } = req.body;

        if (!username || !password || !email || !phoneNumber) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ tên đăng nhập, mật khẩu, email và số điện thoại' });
        }
        if (!REQUESTABLE_ROLES.has(role)) {
            return res.status(400).json({ message: 'Vai trò đăng ký không hợp lệ' });
        }
        if (role === 'player' && (!profileData.name || !profileData.birthYear || !profileData.gender || !profileData.skillLevel)) {
            return res.status(400).json({ message: 'Hồ sơ vận động viên chưa đầy đủ' });
        }

        const existingUser = await User.findOne({ $or: [{ username }, { email }, { phoneNumber }] });
        if (existingUser) {
            return res.status(409).json({ message: 'Tên đăng nhập, email hoặc số điện thoại đã tồn tại' });
        }

        const playerRole = await Role.findOne({ name: 'player' });
        if (!playerRole) {
            return res.status(500).json({ message: 'Hệ thống chưa khởi tạo role player' });
        }

        const requestedRole = role === 'player' ? null : role;
        const user = await User.create({
            username,
            email,
            phoneNumber,
            hashedPassword: await bcrypt.hash(password, 10),
            roles: [playerRole._id],
            requestedRole,
            roleRequestStatus: requestedRole ? 'pending' : 'none',
            requestedProfile: requestedRole ? profileData : null
        });

        if (role === 'player') {
            const birthDate = profileData.birthDate || (profileData.birthYear ? `${profileData.birthYear}-01-01` : null);
            await Player.create({
                userId: user._id,
                name: profileData.name || username,
                birthDate,
                gender: profileData.gender,
                skill: profileData.skill ?? profileData.skillLevel
            });
        }

        const { accessToken, refreshToken } = await issueSession(user._id);
        setRefreshCookie(res, refreshToken);

        return res.status(201).json({
            message: requestedRole
                ? 'Đăng ký thành công. Yêu cầu vai trò đang chờ quản trị viên duyệt.'
                : 'Đăng ký thành công.',
            accessToken,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                phoneNumber: user.phoneNumber,
                roles: ['player'],
                requestedRole,
                roleRequestStatus: user.roleRequestStatus
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ message: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Tên đăng nhập và mật khẩu không được để trống' });
        }

        const user = await User.findOne({
            $or: [{ username }, { email: username }]
        }).populate('roles', 'name');
        if (!user || !(await bcrypt.compare(password, user.hashedPassword))) {
            return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
        }
        if (user.status !== 'actived') {
            return res.status(403).json({ message: 'Tài khoản hiện không được phép đăng nhập' });
        }

        const { accessToken, refreshToken } = await issueSession(user._id);
        setRefreshCookie(res, refreshToken);
        const organization = user.roles.some((role) => role.name === 'org')
            ? await Organization.findOne({ ownerId: user._id }).select('name').lean()
            : null;

        return res.status(200).json({
            message: `Chào mừng ${user.username}, bạn đã đăng nhập thành công!`,
            accessToken,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                phoneNumber: user.phoneNumber,
                roles: user.roles.map((role) => role.name),
                requestedRole: user.requestedRole,
                roleRequestStatus: user.roleRequestStatus,
                organizationName: organization?.name || null
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Lỗi hệ thống khi đăng nhập' });
    }
};

export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;
        if (refreshToken) await Session.deleteOne({ refreshToken });

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });
        return res.status(200).json({ message: 'Đăng xuất thành công' });
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({ message: 'Lỗi hệ thống khi đăng xuất' });
    }
};
