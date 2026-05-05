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

        const user = await User.findById(currentId);
        if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

        switch (user.role) {
            case 'Player': {
                const { name, gender, skill, birthYear } = req.body;

                if (!name || !gender || !skill || !birthYear) {
                    return res.status(400).json({ message: "Dữ liệu của bạn đang trống" });
                }

                
                const existingPlayer = await players.findOne({ userId: currentId });
                if (existingPlayer) {
                    return res.status(400).json({ message: "Tài khoản này đã có hồ sơ Cầu thủ rồi!" });
                }

                await players.create({
                    name,
                    userId: currentId,
                    gender,
                    skill,
                    birthYear
                });
                break;
            }

            case 'Referee': {
                const { name, phone, experienceYears, birthYear } = req.body;
                if (!name || !phone || !birthYear || !experienceYears) {
                    return res.status(400).json({ message: "Tên, SĐT, Số năm kinh nghiệm và Năm sinh Trọng tài không được để trống" });
                }

               
                const existingReferee = await Referee.findOne({ userId: currentId });
                if (existingReferee) {
                    return res.status(400).json({ message: "Tài khoản này đã có hồ sơ Trọng tài rồi!" });
                }
                
                await Referee.create({
                    name,
                    phone,
                    userId: currentId,
                    experienceYears,
                    birthYear,
                    status: 'available'
                });
                break;
            }

            case 'Organization': { 
                const { orgName, phone, address, description } = req.body;

                if (!orgName || !phone || !address) {
                    return res.status(400).json({
                        message: "Tên tổ chức, Số điện thoại và Địa chỉ không được để trống"
                    });
                }

                const existingOrg = await Organization.findOne({ userId: currentId });
                if (existingOrg) {
                    return res.status(400).json({ message: "Tài khoản này đã đăng ký hồ sơ Tổ chức rồi!" });
                }

                await Organization.create({
                    orgName,
                    userId: currentId,
                    phone,
                    address,
                    description,
                });
                break;
            }

            default: return res.status(400).json({ message: "Role không hợp lệ" });
        }

        return res.status(200).json({ message: "Đăng ký hoàn tất!" });

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
        const { email, displayName } = req.query;

        if (!email && !displayName) {
            return res.status(400).json({ 
                success: false,
                message: "Vui lòng cung cấp email hoặc displayName để tìm kiếm" 
            });
        }

        // Tạo query tìm kiếm
        let searchQuery = { role: 'Player' }; // Chỉ tìm các Player
        
        if (email) {
            searchQuery.email = { $regex: email, $options: 'i' }; // Case-insensitive search
        }
        
        if (displayName) {
            searchQuery.displayName = { $regex: displayName, $options: 'i' };
        }

        const users = await User.find(searchQuery, 'displayName email role _id');
        
        if (users.length === 0) {
            return res.status(200).json({
                success: true,
                data: [],
                message: "Không tìm thấy người chơi nào"
            });
        }

        return res.status(200).json({
            success: true,
            data: users,
            message: `Tìm thấy ${users.length} người chơi`
        });

    } catch (error) {
        console.error("Lỗi tìm kiếm user:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi hệ thống khi tìm kiếm",
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
