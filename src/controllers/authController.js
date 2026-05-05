import bcrypt from 'bcrypt';
import crypto from 'crypto';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import Session from '../models/session.js';

const ACCESS_TOKEN_TTL = 30 * 60 * 1000; // 30 phút (tính bằng ms để set Cookie)
const REFRESH_TOKEN_TTL = 12 * 24 * 60 * 60 * 1000; // 12 ngày

// 1. ĐĂNG KÝ TÀI KHOẢN
export const register = async (req, res) => {
    try {
        const { username, password, email, displayName, role, confirmPassword,phoneNumber } = req.body;

        // 1. Validate input
        if (!username || !password || !email || !displayName ||!confirmPassword || !role || !phoneNumber) {
            return res.status(400).json({
                message: "Vui lòng nhập đầy đủ thông tin (Tên đăng nhập, Mật khẩu, Email, Tên hiển thị)"
            });
        }
        if (confirmPassword !== password) {
            return res.status(400).json({
                message: "Mật khẩu xác nhận không trùng khớp"
            });
        }

        // 2. Kiểm tra tồn tại
        const check = await User.findOne({ username });
        if (check) {
            return res.status(409).json({ message: "Tên đăng nhập đã tồn tại" });
        }

        // 3. Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Tạo người dùng mới
        const newUser = await User.create({
            username,
            hashedPassword,
            email,
            displayName,
            phoneNumber: phoneNumber,
            role: role || 'Player' // Đặt mặc định nếu không có role
        });

        // 5. Tạo Access Token
        const accessToken = jwt.sign(
            { userId: newUser._id },
            process.env.ACCESS_TOKEN,
            { expiresIn: ACCESS_TOKEN_TTL } 
        );

        // 6. Tạo Refresh Token
        const refreshToken = crypto.randomBytes(64).toString('hex');

        // 7. Lưu Session vào DB
        await Session.create({
            userId: newUser._id,
            refreshToken,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL), 
        });

        // 8. Gửi Refresh Token qua Cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax', // 'lax' tốt hơn cho môi trường localhost (khác port 5173 và 5001)
            maxAge: ACCESS_TOKEN_TTL,
        });

        // 9. Trả về Access Token cho Client
        return res.status(201).json({
            message: "Đăng ký và đăng nhập thành công!",
            accessToken,
            user: {
                username: newUser.username,
                displayName: newUser.displayName,
                role: newUser.role
            }
        });

    } catch (error) {
        console.error("Lỗi trong hàm Register:", error);
        return res.status(500).json({ message: "Lỗi hệ thống khi đăng ký" });
    }
}

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
            message: `Chào mừng ${user.displayName}, bạn đã đăng nhập thành công!`,
            accessToken,
            user: {
                id: user._id,
                username: user.username,
                displayName: user.displayName,
                role: user.role
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
