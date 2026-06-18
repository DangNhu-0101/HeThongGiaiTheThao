import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import Session from '../models/session.js';
import Role from '../models/roles.js';
import User from '../models/users.js';
import Player from '../models/players.js';       // <--- THIẾU DÒNG NÀY ĐÂY!
import Referee from '../models/referees.js';     // Import luôn cho chắc
import Organization from '../models/orgs.js'; // Import luôn cho chắc

const ACCESS_TOKEN_TTL = 30 * 60 * 60*1000; // 30 phút (tính bằng ms để set Cookie)
const REFRESH_TOKEN_TTL = 12 * 24 * 60 * 60 * 1000; // 12 ngày

// 1. ĐĂNG KÝ TÀI KHOẢN
export const register = async (req, res) => {
    try {
        // 1. Chỉ lấy các trường cơ bản, bỏ role và profileData
        const { username, password, email, phoneNumber } = req.body;

        // 2. Kiểm tra dữ liệu đầu vào
        if (!username || !password || !email || !phoneNumber) {
            return res.status(400).json({ message: "Vui lòng nhập đầy đủ username, password, email, số điện thoại" });
        }

        // 3. Kiểm tra trùng lặp
        const check = await User.findOne({ $or: [{ username }, { email }, { phoneNumber }] });
        if (check) return res.status(409).json({ message: "Username, Email hoặc SĐT đã tồn tại!" });

        // 4. Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // 5. Tìm role mặc định (isDefault: true)
        const defaultRole = await Role.findOne({ isDefault: true });
        if (!defaultRole) {
            return res.status(500).json({ message: "Hệ thống chưa cấu hình role mặc định. Vui lòng liên hệ quản trị viên." });
        }

        // 6. Tạo user mới (chỉ có thông tin cơ bản + role mặc định)
        const newUser = new User({
            username,
            hashedPassword,
            email,
            phoneNumber,
            roles: defaultRole._id,      // gán ObjectId của role mặc định           // không có avatar, status sẽ mặc định 'active'
        });

        await newUser.save();

        // 8. Tạo token
        const accessToken = jwt.sign(
            { userId: newUser._id },
            process.env.ACCESS_TOKEN || 'SECRET_KEY_TAM_THOI',
            { expiresIn: '15m' }
        );

        const refreshToken = crypto.randomBytes(64).toString('hex');

        // 9. Lưu session
        await Session.create({
            userId: newUser._id,
            refreshToken,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL)
        });

        // 10. Set cookie và trả về
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: REFRESH_TOKEN_TTL
        });

        return res.status(201).json({
            message: "Đăng ký thành công!",
            accessToken,
            user: {
                username: newUser.username,
                email: newUser.email,
                phoneNumber: newUser.phoneNumber,
                role: defaultRole.name
            }
        });

    } catch (error) {
        console.error("LỖI TẠI REGISTER_FULL:", error);
        return res.status(500).json({
            message: "Server bị lỗi rồi: " + error.message
        });
    }
};

// 2. ĐĂNG NHẬP TRUYỀN THỐNG
export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: "Tên đăng nhập và mật khẩu không được để trống"
            });
        }

        // Tìm người dùng trong DB
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(401).json({
                message: "Tên đăng nhập hoặc mật khẩu không chính xác"
            });
        }

        // Kiểm tra mật khẩu đã mã hóa
        const passwordCorrect = await bcrypt.compare(password, user.hashedPassword);

        if (!passwordCorrect) {
            return res.status(401).json({
                message: "Tên đăng nhập hoặc mật khẩu không chính xác"
            });
        }

        // Tạo Access Token (JWT)
        const accessToken = jwt.sign(
            { userId: user._id },
            process.env.ACCESS_TOKEN,
            { expiresIn: ACCESS_TOKEN_TTL }
        );

        // Tạo Refresh Token (Chuỗi ngẫu nhiên bảo mật cao)
        const refreshToken = crypto.randomBytes(64).toString('hex');

        // Lưu phiên đăng nhập (Session) vào cơ sở dữ liệu
        await Session.create({
            userId: user._id,
            refreshToken,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
        });

        // Gửi Refresh Token qua Cookie bảo mật
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: REFRESH_TOKEN_TTL,
        });

        // Trả về Access Token cho phía Client
        return res.status(200).json({
            message: `Chào mừng ${user.username}, bạn đã đăng nhập thành công!`,
            accessToken,
            user: {
                id: user._id,
                username: user.username,
                role: user.roles
            }
        });

    } catch (error) {
        console.error("Lỗi trong hàm Đăng nhập:", error);
        return res.status(500).json({
            message: "Lỗi hệ thống khi đăng nhập"
        });
    }
}

// 3. ĐĂNG XUẤT
export const logout = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;
        if (token) await Session.deleteOne({ refreshToken: token });

        // Xóa phiên làm việc trong Database
        if (token) {
            await Session.deleteOne({ refreshToken: token });
        }

        // Xóa sạch Cookie ở trình duyệt
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        });

        return res.status(200).json({
            message: "Đăng xuất thành công"
        });
    } catch (error) {
        console.error("Lỗi trong hàm Đăng xuất:", error);
        return res.status(500).json({
            message: "Lỗi hệ thống khi đăng xuất"
        });
    }
}
