import express from 'express';
import bcrypt from 'bcrypt';
import User from '../models/users.js';
import Players from '../models/players.js';
import Referee from '../models/referees.js';
import Organization from '../models/orgs.js';

export const authMe = async (req, res) => {
    const user = req.user
    return res.status(200).json({
        message: "Lấy thông tin Auth thành công",
        user: req.user
    });
};
export const getAllUsers = async (req, res) => {
    try {
        console.log("=== getAllUsers CALLED ===");
        
        const users = await User.find({}, 'username email phoneNumber role').lean();
        console.log("Users found:", users.length);
        
        const userIds = users.map(u => u._id);
        console.log("User IDs:", userIds.length);
        
        const players = await Players.find({ userId: { $in: userIds } }, 'userId name gender birthDate status sports').lean();
        console.log("Players found:", players.length);
        
        const playerMap = {};
        players.forEach(p => { playerMap[p.userId.toString()] = p; });
        
        const result = users.map(u => {
            const player = playerMap[u._id.toString()];
            return {
                _id: u._id,
                username: u.username,
                email: u.email,
                phoneNumber: u.phoneNumber,
                role: u.role,
                name: player?.name || u.username,
                gender: player?.gender || '',
                birthDate: player?.birthDate || null,
                playerStatus: player?.status || '',
                level: player?.sports?.[0]?.level || '',
                sports: player?.sports || []
            };
        });
        
        console.log("Result count:", result.length);
        
        res.json({ success: true, data: result });
    } catch (error) {
        console.error("❌ getAllUsers ERROR:", error.message);
        console.error("Stack:", error.stack);
        res.status(500).json({ success: false, message: error.message });
    }
};
export const searchUsers = async (req, res) => {
    try {
        const { email, name } = req.query;
        if (!email && !name) {
            return res.status(400).json({ success: false, message: "Vui lòng cung cấp email hoặc name" });
        }
        
        let searchQuery = { role: 'player' };
        if (email) searchQuery.email = { $regex: email, $options: 'i' };
        if (name) {
            searchQuery.$or = [
                { username: { $regex: name, $options: 'i' } },
                { email: { $regex: name, $options: 'i' } },
            ];
        }
        
        // Tìm users và populate Player info
        const users = await User.find(searchQuery, 'username email role _id').lean();
        
        // Lấy thêm Player info cho mỗi user
        const userIds = users.map(u => u._id);
        const players = await Players.find({ userId: { $in: userIds } }, 'name level userId').lean();
        const playerMap = {};
        players.forEach(p => { playerMap[p.userId.toString()] = p; });
        
        const result = users.map(u => ({
            ...u,
            playerInfo: playerMap[u._id.toString()] || null
        }));
        
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
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
        if (user.role === "player") {
            profileDetails = await players.findOne({ userId: currentId });
        } else if (user.role === "referee") {
            profileDetails = await Referee.findOne({ userId: currentId });
        } else if (user.role === "org") {
            profileDetails = await Organization.findOne({ userId: currentId });
        }

        const userObject = user.toObject();
        const profileObject = profileDetails ? profileDetails.toObject() : {};

        const customData = {
            username: userObject.username,
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

        const { username, avatarUrl, ...details } = req.body;

        const userUpdateData = {};
        if (username) userUpdateData.username = username;
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

        if (updatedUser.role === "player") {
            updatedDetails = await players.findOneAndUpdate(
                { userId: currentId },
                { $set: details },
                { new: true, runValidators: true }
            );
        }
        else if (updatedUser.role === "referee") {
            updatedDetails = await Referee.findOneAndUpdate(
                { userId: currentId },
                { $set: details },
                { new: true, runValidators: true }
            );
        }
        else if (updatedUser.role === "org") {
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
            username: userObject.username,
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
export const getAllOrganizations = async (req, res) => {
    try {
        // Query từ Organization collection, không phải User collection
        const organizations = await Organization.find({}, { name: 1, _id: 1 });
        
        console.log("Organizations from DB:", organizations); // Debug
        
        res.status(200).json({
            success: true,
            message: 'Lấy danh sách tổ chức thành công',
            data: organizations // Array of {_id, name}
        });
    } catch (error) {
        console.error("Lỗi getAllOrganizations:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
