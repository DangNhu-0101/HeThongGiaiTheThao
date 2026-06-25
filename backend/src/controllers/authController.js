// controllers/authController.js
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import Session from '../models/session.js';
import Role from '../models/roles.js';
import User from '../models/users.js';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = 12 * 24 * 60 * 60 * 1000; // 12 ngày

// Helper: generate tokens
const generateTokens = (userId) => {
    const accessToken = jwt.sign(
        { userId },
        process.env.ACCESS_TOKEN_SECRET || 'your_access_secret',
        { expiresIn: ACCESS_TOKEN_TTL }
    );
    const refreshToken = crypto.randomBytes(64).toString('hex');
    return { accessToken, refreshToken };
};

// Helper: save session
const saveSession = async (userId, refreshToken) => {
    await Session.create({
        userId,
        refreshToken,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL)
    });
};

// 1. Đăng ký (chỉ tạo user, mặc định role player)
export const register = async (req, res) => {
    try {
        const { username, password, email, phoneNumber } = req.body;

        // Validate cơ bản
        if (!username || !password || !email || !phoneNumber) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ username, password, email, số điện thoại' });
        }

        // Kiểm tra trùng
        const existingUser = await User.findOne({
            $or: [{ username }, { email }, { phoneNumber }]
        });
        if (existingUser) {
            return res.status(409).json({ message: 'Username, Email hoặc SĐT đã tồn tại!' });
        }

        // Lấy role mặc định (isDefault: true) – theo logic initRoles, đó là 'player'
        const defaultRole = await Role.findOne({ isDefault: true });
        if (!defaultRole) {
            return res.status(500).json({ message: 'Hệ thống chưa cấu hình role mặc định. Vui lòng liên hệ quản trị viên.' });
        }

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo user mới với role mặc định
        const newUser = new User({
            username,
            hashedPassword,
            email,
            phoneNumber,
            roles: [defaultRole._id]
        });
        await newUser.save();

        // Tạo token
        const { accessToken, refreshToken } = generateTokens(newUser._id);
        await saveSession(newUser._id, refreshToken);

        // Set cookie refresh token
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: REFRESH_TOKEN_TTL
        });

        return res.status(201).json({
            message: 'Đăng ký thành công!',
        });
    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ message: 'Lỗi server: ' + error.message });
    }
};

// 2. Đăng nhập
export const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Tên đăng nhập và mật khẩu không được để trống' });
        }

        // Tìm user và populate roles
        const user = await User.findOne({
            $or: [{ username }, { email: username }]
        }).populate('roles', 'name');

        if (!user) {
            return res.status(401).json({ message: 'Sai tên đăng nhập hoặc mật khẩu' });
        }

        // So sánh mật khẩu
        const isMatch = await bcrypt.compare(password, user.hashedPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Sai tên đăng nhập hoặc mật khẩu' });
        }

        // Xóa session cũ (tùy chọn: chỉ giữ 1 phiên đăng nhập)
        await Session.deleteMany({ userId: user._id });

        // Tạo token mới
        const { accessToken, refreshToken } = generateTokens(user._id);
        await saveSession(user._id, refreshToken);

        // Set cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: REFRESH_TOKEN_TTL
        });

        return res.status(200).json({
            message: `Chào mừng ${user.username}`,
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Lỗi server' });
    }
};

// 3. Đăng xuất
export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;
        if (refreshToken) {
            await Session.deleteOne({ refreshToken });
        }
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
        return res.status(200).json({ message: 'Đăng xuất thành công' });
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({ message: 'Lỗi server' });
    }
};