import express from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import players from '../models/players.js';
import Referee from '../models/referees.js';
import Organization from '../models/orgnizations.js'; 

export const authMe = async (req, res) => {
    const user = req.user
    return res.status(200).json({
        message: "Lấy thông tin Auth thành công",
        user: req.user
    });
};

export const completeUser = async (req, res) => {
    try {
        const currentId = req.user._id; 

        // Lấy thông tin User đã đăng ký ở Bước 1
        const user = await User.findById(currentId);
        if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

        switch (user.role) {
            case 'Player': {
                const { skill } = req.body;

                if (!skill) {
                    return res.status(400).json({ message: "Vui lòng chọn trình độ (Skill)" });
                }

                const existingPlayer = await players.findOne({ userId: currentId });
                if (existingPlayer) {
                    return res.status(400).json({ message: "Tài khoản này đã có hồ sơ Cầu thủ rồi!" });
                }

                // Truyền dữ liệu từ User (Bước 1) vào Profile (Bước 2)
                await players.create({
                    name: user.displayName,
                    userId: currentId,
                    gender: user.gender,
                    skill: skill,
                    birthYear: user.birthYear
                });
                break;
            }

            case 'Referee': {
                const { experienceYears } = req.body;
                if (!experienceYears) {
                    return res.status(400).json({ message: "Số năm kinh nghiệm không được để trống" });
                }

                const existingReferee = await Referee.findOne({ userId: currentId });
                if (existingReferee) {
                    return res.status(400).json({ message: "Tài khoản này đã có hồ sơ Trọng tài rồi!" });
                }
                
                // Lấy phone và birthYear từ tài khoản user đã đăng ký
                await Referee.create({
                    name: user.displayName,
                    phone: user.phoneNumber,
                    userId: currentId,
                    experienceYears: experienceYears,
                    birthYear: user.birthYear,
                    status: 'available'
                });
                break;
            }

            case 'Organization': { 
                const { orgName, address, description } = req.body;

                if (!orgName || !address) {
                    return res.status(400).json({
                        message: "Tên tổ chức và Địa chỉ không được để trống"
                    });
                }

                const existingOrg = await Organization.findOne({ userId: currentId });
                if (existingOrg) {
                    return res.status(400).json({ message: "Tài khoản này đã đăng ký hồ sơ Tổ chức rồi!" });
                }

                // Dùng phoneNumber từ Bước 1 làm hotline tổ chức mặc định
                await Organization.create({
                    orgName,
                    userId: currentId,
                    phone: user.phoneNumber,
                    address,
                    description,
                });
                break;
            }

            default: return res.status(400).json({ message: "Role không hợp lệ" });
        }

        return res.status(200).json({ message: "Cập nhật hồ sơ vai trò hoàn tất!" });

    } catch (error) {
        console.error("Lỗi trong hàm completeUser:", error);
        return res.status(500).json({
            message: "Lỗi hệ thống trong quá trình hoàn thành đăng ký",
            error: error.message
        });
    }
}

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, 'displayName username role'); 
        res.json({ data: users });
    } catch (error) {
        res.status(500).json({ message: "Lỗi lấy danh sách user" });
    }
};

export const searchUsers = async (req, res) => {
    try {
        const { keyword } = req.query;
        const currentUserId = req.user?.id || req.user?._id; // Lấy ID của user đang login từ authMiddleware

        if (!keyword || keyword.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập từ khóa tìm kiếm!"
            });
        }

        const safeKeyword = keyword.trim();

        // 🔎 Tìm kiếm theo Tên hiển thị HOẶC Số điện thoại
        // Đồng thời loại bỏ chính tài khoản đang đăng nhập ra khỏi kết quả
        const query = {
            _id: { $ne: currentUserId }, // Không hiển thị chính mình
            role: 'Player', // Chỉ cho phép tìm kiếm những người có vai trò là Player (VĐV)
            $or: [
                { displayName: { $regex: safeKeyword, $options: 'i' } }, // Regex không phân biệt chữ hoa/thường
                { phoneNumber: { $regex: safeKeyword, $options: 'i' } }
            ]
        };

        // Lấy các trường thông tin cơ bản để hiển thị lên UI và bảo mật số điện thoại
        const users = await User.find(query)
            .select('displayName phoneNumber skill email gender') 
            .limit(10) // Giới hạn tối đa 10 kết quả trả về để tối ưu hiệu năng
            .lean();

        return res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });

    } catch (error) {
        console.error("🔥 Lỗi tại searchUsers API:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi hệ thống khi tìm kiếm thành viên",
            error: error.message
        });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const currentId = req.user._id;

        const user = await User.findById(currentId).select('+hashedPassword');

        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy người dùng" });
        }

        const checkPassword = await bcrypt.compare(currentPassword, user.hashedPassword);

        if (!checkPassword) {
            return res.status(400).json({ message: "Mật khẩu hiện tại không trùng khớp" })
        }

        user.hashedPassword = await bcrypt.hash(newPassword, 10);
        await user.save();

        return res.status(200).json({ message: "Đổi mật khẩu thành công" });
    } catch (error) {
        console.error("Lỗi trong hàm changePassword:", error);
        return res.status(500).json({
            message: "Lỗi hệ thống trong quá trình đổi mật khẩu",
            error: error.message
        });
    }
}

export const getProfile = async (req, res) => {
    try {
        const currentId = req.user._id;

        const user = await User.findById(currentId).select("-hashedPassword");

        if (!user) {
            return res.status(401).json({ message: "Người dùng không tồn tại" });
        }
        
        let profileDetails = null;
        if (user.role === "Player") {
            profileDetails = await players.findOne({ userId: currentId });
        } else if (user.role === "Referee") {
            profileDetails = await Referee.findOne({ userId: currentId });
        } else if (user.role === "Organization") { 
            profileDetails = await Organization.findOne({ userId: currentId });
        }
        
        const userObject = user.toObject();
        const profileObject = profileDetails ? profileDetails.toObject() : {};

        const customData = {
            displayName: userObject.displayName,   
            avatarUrl: userObject.avatarUrl,
            email: userObject.email,
            role: userObject.role,
            ...profileObject, 
        };

      
        return res.status(200).json({
            message: "Lấy thông tin profile thành công",
            data: customData
        });

    } catch (error) {
        console.error("Lỗi trong hàm getProfile:", error);
        return res.status(500).json({
            message: "Lỗi hệ thống trong quá trình lấy thông tin",
            error: error.message
        });
    }
}

export const editProfile = async (req, res) => {
    try {
        const currentId = req.user._id;

        const { displayName, avatarUrl, ...details } = req.body;

        const userUpdateData = {};
        if (displayName) userUpdateData.displayName = displayName;
        if (avatarUrl) userUpdateData.avatarUrl = avatarUrl;

        const updatedUser = await User.findByIdAndUpdate(
            currentId,
            { $set: userUpdateData },
            { new: true, runValidators: true }
        ).select("-hashedPassword");

        if (!updatedUser) {
            return res.status(404).json({ message: "Người dùng không tồn tại" });
        }

        let updatedDetails = null;

        if (updatedUser.role === "Player") {
            updatedDetails = await players.findOneAndUpdate(
                { userId: currentId },
                { $set: details },
                { new: true, runValidators: true }
            );
        }
        else if (updatedUser.role === "Referee") {
            updatedDetails = await Referee.findOneAndUpdate(
                { userId: currentId },
                { $set: details },
                { new: true, runValidators: true }
            );
        }
        else if (updatedUser.role === "Organization") { 
            updatedDetails = await Organization.findOneAndUpdate(
                { userId: currentId },
                { $set: details },
                { new: true, runValidators: true }
            );
        }

        const userObject = updatedUser.toObject();
        const profileObject = updatedDetails ? updatedDetails.toObject() : {};

        const customData = {
            email: userObject.email,
            displayName: userObject.displayName,
            avatarUrl: userObject.avatarUrl,
            role: userObject.role,
            ...profileObject,
        };
        
        return res.status(200).json({
            success: true,
            message: "Cập nhật thông tin hồ sơ thành công",
            data: customData
        });

    } catch (error) {
        console.error("Lỗi trong hàm editProfile:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi hệ thống khi cập nhật hồ sơ",
            error: error.message
        });
    }
};
