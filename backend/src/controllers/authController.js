import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import Session from '../models/session.js';
import Role from '../models/roles.js';
import User from '../models/users.js';
import PasswordResetToken from '../models/passwordResetTokens.js';
import { sendPasswordResetCode } from '../services/mailService.js';
import { ensurePlayerProfileForUser } from '../services/playerProfileService.js';

const ACCESS_TOKEN_TTL = '30m';
const REFRESH_TOKEN_TTL = 12 * 24 * 60 * 60 * 1000;
const DEFAULT_PLAYER_ROLE = {
    name: 'player',
    displayName: 'Cầu thủ',
    permissions: ['view_tournament', 'join_team'],
    isDefault: true
};

const toAuthUser = (user) => ({
    _id: user._id,
    username: user.username,
    email: user.email,
    phoneNumber: user.phoneNumber,
    avatar: user.avatar || '',
    status: user.status,
    isDefaultGenerated: Boolean(user.isDefaultGenerated),
    mustChangePassword: Boolean(user.mustChangePassword),
    roles: (user.roles || []).map((role) => {
        if (role && typeof role === 'object' && role.name) return { _id: role._id, name: role.name };
        return role;
    }),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
});

const generateTokens = (userId) => {
    const accessToken = jwt.sign(
        { userId },
        process.env.ACCESS_TOKEN_SECRET || 'your_access_secret',
        { expiresIn: ACCESS_TOKEN_TTL }
    );
    const refreshToken = crypto.randomBytes(64).toString('hex');
    return { accessToken, refreshToken };
};

const saveSession = async (userId, refreshToken) => {
    await Session.create({
        userId,
        refreshToken,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL)
    });
};

const setAuthCookies = (res, accessToken, refreshToken) => {
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    };

    res.cookie('accessToken', accessToken, {
        ...cookieOptions,
        maxAge: REFRESH_TOKEN_TTL
    });
    res.cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: REFRESH_TOKEN_TTL
    });
};

const ensureDefaultPlayerRole = async () => {
    const playerRole = await Role.findOneAndUpdate(
        { name: DEFAULT_PLAYER_ROLE.name },
        { $set: DEFAULT_PLAYER_ROLE },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    await Role.updateMany(
        { _id: { $ne: playerRole._id }, isDefault: true },
        { $set: { isDefault: false } }
    );

    return playerRole;
};

const PASSWORD_RESET_TTL_MINUTES = Number(process.env.PASSWORD_RESET_CODE_TTL_MINUTES || 10);
const PASSWORD_RESET_TOKEN_TTL_MINUTES = Number(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || 10);
const PASSWORD_RESET_MAX_ATTEMPTS = Number(process.env.PASSWORD_RESET_MAX_ATTEMPTS || 5);
const PASSWORD_RESET_RESEND_COOLDOWN_SECONDS = Number(process.env.PASSWORD_RESET_RESEND_COOLDOWN_SECONDS || 60);


const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const isEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');
const createSixDigitCode = () => String(crypto.randomInt(100000, 1000000));

export const requestPasswordReset = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        if (!isEmail(email)) {
            return res.status(400).json({ message: 'Email không hợp lệ' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ message: GENERIC_RESET_MESSAGE });
        }

        const recentToken = await PasswordResetToken.findOne({
            userId: user._id,
            usedAt: null,
            createdAt: { $gt: new Date(Date.now() - PASSWORD_RESET_RESEND_COOLDOWN_SECONDS * 1000) },
        }).sort({ createdAt: -1 });
        if (recentToken) {
            return res.status(429).json({ message: 'Vui lòng cho truoc khi gui lai ma xac minh.' });
        }

        await PasswordResetToken.updateMany(
            { userId: user._id, usedAt: null },
            { $set: { usedAt: new Date() } },
        );

        const code = createSixDigitCode();
        const token = await PasswordResetToken.create({
            userId: user._id,
            email,
            codeHash: sha256(code),
            expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000),
        });

        try {
            await sendPasswordResetCode({ to: email, code, ttlMinutes: PASSWORD_RESET_TTL_MINUTES });
        } catch (mailError) {
            await PasswordResetToken.deleteOne({ _id: token._id });
            console.error('Password reset email failed:', {
                email,
                error: mailError.message,
            });
            return res.status(503).json({ message: 'Không thể gui email xac minh. Vui lòng thử lại sau.' });
        }

        return res.json({ message: GENERIC_RESET_MESSAGE });
    } catch (error) {
        console.error('Request password reset error:', error);
        return res.status(500).json({ message: 'Lỗi server khi yeu cau dat lai mật khẩu' });
    }
};

export const verifyPasswordResetCode = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const code = String(req.body.code || '').trim();
        if (!isEmail(email) || !/^\d{6}$/.test(code)) {
            return res.status(400).json({ message: 'Email hoặc mã xác minh không hợp lệ' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Mã xác minh không hợp lệ hoặc đã hết hạn' });
        }

        const token = await PasswordResetToken.findOne({
            userId: user._id,
            email,
            usedAt: null,
            expiresAt: { $gt: new Date() },
        }).sort({ createdAt: -1 });
        if (!token) {
            return res.status(400).json({ message: 'Mã xác minh không hợp lệ hoặc đã hết hạn' });
        }
        if (token.attempts >= PASSWORD_RESET_MAX_ATTEMPTS) {
            token.usedAt = new Date();
            await token.save();
            return res.status(429).json({ message: 'Mã xác minh đã bị khóa do nhập sai quá nhiều lần' });
        }
        if (token.codeHash !== sha256(code)) {
            token.attempts += 1;
            await token.save();
            return res.status(400).json({ message: 'Mã xác minh không hợp lệ hoặc đã hết hạn' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        token.resetTokenHash = sha256(resetToken);
        token.resetTokenExpiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000);
        token.verifiedAt = new Date();
        await token.save();

        return res.json({
            message: 'Xác minh thành công',
            resetToken,
        });
    } catch (error) {
        console.error('Verify password reset code error:', error);
        return res.status(500).json({ message: 'Lỗi server khi xac minh ma' });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const resetToken = String(req.body.resetToken || '').trim();
        const newPassword = String(req.body.newPassword || '');
        if (!resetToken || newPassword.length < 8) {
            return res.status(400).json({ message: 'Mật khẩu mới phai co it nhất 8 ky tu' });
        }

        const token = await PasswordResetToken.findOne({
            resetTokenHash: sha256(resetToken),
            usedAt: null,
            resetTokenExpiresAt: { $gt: new Date() },
        });
        if (!token) {
            return res.status(400).json({ message: 'Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn' });
        }

        const user = await User.findById(token.userId);
        if (!user) {
            token.usedAt = new Date();
            await token.save();
            return res.status(400).json({ message: 'Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn' });
        }

        user.hashedPassword = await bcrypt.hash(newPassword, 10);
        token.usedAt = new Date();
        await Promise.all([
            user.save(),
            token.save(),
            Session.deleteMany({ userId: user._id }),
        ]);

        return res.json({ message: 'Dat lai mật khẩu thành công. Vui lòng đăng nhập lai.' });
    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({ message: 'Lỗi server khi dat lai mật khẩu' });
    }
};

export const register = async (req, res) => {
    try {
        const { username, password, email, phoneNumber } = req.body;

        if (!username || !password || !email || !phoneNumber) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ username, password, email, số điện thoại' });
        }

        const existingUser = await User.findOne({
            $or: [{ username }, { email }, { phoneNumber }]
        });
        if (existingUser) {
            return res.status(409).json({ message: 'Username, Email hoặc SĐT đã tồn tại!' });
        }

        const defaultRole = await ensureDefaultPlayerRole();

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            username,
            hashedPassword,
            email,
            phoneNumber,
            roles: [defaultRole._id]
        });
        await newUser.save();
        await ensurePlayerProfileForUser(newUser);
        await newUser.populate('roles', 'name');

        const { accessToken, refreshToken } = generateTokens(newUser._id);
        await saveSession(newUser._id, refreshToken);
        setAuthCookies(res, accessToken, refreshToken);

        return res.status(201).json({
            message: 'Đăng ký thành công!',
            accessToken,
            user: toAuthUser(newUser)
        });
    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ message: 'Lỗi server: ' + error.message });
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

        if (!user) {
            return res.status(401).json({ message: 'Sai tên đăng nhập hoặc mật khẩu' });
        }

        const isMatch = await bcrypt.compare(password, user.hashedPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Sai tên đăng nhập hoặc mật khẩu' });
        }

        await Session.deleteMany({ userId: user._id });

        const { accessToken, refreshToken } = generateTokens(user._id);
        await saveSession(user._id, refreshToken);
        setAuthCookies(res, accessToken, refreshToken);

        return res.status(200).json({
            message: `Chào mừng ${user.username}`,
            accessToken,
            user: toAuthUser(user)
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Lỗi server' });
    }
};

export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;
        if (refreshToken) {
            await Session.deleteOne({ refreshToken });
        }
        res.clearCookie('refreshToken', {});
        res.clearCookie('accessToken', {});
        return res.status(200).json({ message: 'Đăng xuất thành công' });
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({ message: 'Lỗi server' });
    }
};
