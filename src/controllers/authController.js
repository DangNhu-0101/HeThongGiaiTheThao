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
        const { username, password, gender, birthYear, email, displayName, role, confirmPassword, phoneNumber } = req.body;

        // 1. Validate input
        if (!username || !password || !gender || !birthYear || !email || !displayName || !confirmPassword || !role || !phoneNumber) {
            return res.status(400).json({ message: "Thiếu thông tin đăng ký (Kiểm tra Năm sinh/Giới tính/SĐT)" });
        }

        if (confirmPassword !== password) {
            return res.status(400).json({ message: "Mật khẩu xác nhận không trùng khớp" });
        }

        // 2. Kiểm tra tồn tại
        const check = await User.findOne({ $or: [{ username }, { email }] });
        if (check) {
            return res.status(409).json({ message: "Tên đăng nhập hoặc Email đã tồn tại" });
        }

        // 3. Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Tạo người dùng mới
        const newUser = await User.create({
            username,
            password: hashedPassword,
            email,
            displayName,
            gender,
            birthYear: Number(birthYear),
            phoneNumber,
            role: role || 'Player'
        });

        // 5. Kiểm tra Secret Key (Chống crash 500)
        if (!process.env.ACCESS_TOKEN) {
            console.error("LỖI: Chưa cấu hình ACCESS_TOKEN trong file .env");
            return res.status(500).json({ message: "Lỗi cấu hình server (JWT Secret)" });
        }

        // 6. Tạo Access Token (Dùng chuỗi '30m' cho an toàn)
        const accessToken = jwt.sign(
            { userId: newUser._id },
            process.env.ACCESS_TOKEN,
            { expiresIn: '30m' } 
        );

        // 7. Tạo Refresh Token
        const refreshToken = crypto.randomBytes(64).toString('hex');
        await Session.create({
            userId: newUser._id,
            refreshToken,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL), 
        });

        // 8. Gửi Refresh Token qua Cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: REFRESH_TOKEN_TTL,
        });

        return res.status(201).json({
            message: "Đăng ký thành công!",
            accessToken,
            user: {
                username: newUser.username,
                displayName: newUser.displayName,
                role: newUser.role,
                userId: newUser._id
            }
        });

    } catch (error) {
        // Dòng này cực quan trọng để Như soi lỗi ở Terminal
        console.error("==== LỖI REGISTER CHI TIẾT ====");
        console.error(error); 
        return res.status(500).json({ message: "Lỗi hệ thống: " + error.message });
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
        const passwordCorrect = await bcrypt.compare(password, user.password);

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
