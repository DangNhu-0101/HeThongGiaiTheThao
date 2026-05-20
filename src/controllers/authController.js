import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import Session from '../models/session.js';
import User from '../models/users.js';
import Player from '../models/players.js';      
import Referee from '../models/referees.js';    
import Organization from '../models/orgs.js'; 

const ACCESS_TOKEN_TTL = 30 * 60 * 1000; // 30 phút (tính bằng ms để set Cookie)
const REFRESH_TOKEN_TTL = 12 * 24 * 60 * 60 * 1000; // 12 ngày

// 1. ĐĂNG KÝ TÀI KHOẢN
export const registerFull = async (req, res) => {
    try {
        const { username, password, email, phoneNumber, role, profileData } = req.body;

        // 1. Kiểm tra dữ liệu đầu vào
        if (!username || !password || !email || !phoneNumber || !role || !profileData) {
            return res.status(400).json({ message: "Dữ liệu gửi lên bị thiếu trường rồi Như ơi!" });
        }

        // 2. Kiểm tra trùng lặp
        const check = await User.findOne({ $or: [{ username }, { email }, { phoneNumber }] });
        if (check) return res.status(409).json({ message: "Username, Email hoặc SĐT đã tồn tại!" });

        // 3. Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Khởi tạo User (Chưa save)
        const newUser = new User({
            username,
            hashedPassword,
            email,
            phoneNumber,
            role
        });

        // 5. Khởi tạo Profile tương ứng dựa trên Role
        let profile;
        if (role === 'player') {
            profile = new Player({
                userId: newUser._id,
                name: profileData.name,
                gender: profileData.gender,
                birthDate: profileData.birthDate,
                sports: [{ category: 'Pickleball', level: profileData.skill }]
            });
        } else if (role === 'referee') {
            profile = new Referee({
                userId: newUser._id,
                name: profileData.name,
                birthDate: profileData.birthDate,
                gender: profileData.gender,
                sports: [{ category: 'Pickleball', yearsOfExperience: profileData.experienceYears }]
            });
        } else if (role === 'org') {
            profile = new org({
                ownerId: newUser._id,
                name: profileData.name,
                contactEmail: email,
                contactPhone: phoneNumber,
                address: { city: profileData.city, district: profileData.district, detail: profileData.detail }
            });
        }

        // 6. LƯU CẢ HAI (Nếu 1 cái lỗi, catch sẽ bắt được và không lưu gì cả)
        await newUser.save();
        await profile.save();

        // 7. TẠO TOKEN ĐỂ ĐĂNG NHẬP LUÔN
        const accessToken = jwt.sign(
            { userId: newUser._id },
            process.env.ACCESS_TOKEN || 'SECRET_KEY_TAM_THOI',
            { expiresIn: '15m' }
        );

        const refreshToken = crypto.randomBytes(64).toString('hex');

        // 8. LƯU SESSION
        await Session.create({
            userId: newUser._id,
            refreshToken,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL)
        });

        // 9. TRẢ VỀ KẾT QUẢ
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: REFRESH_TOKEN_TTL
        });

        return res.status(201).json({
            message: "Đăng ký trọn gói thành công!",
            accessToken,
            user: { username: newUser.username, role: newUser.role }
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
