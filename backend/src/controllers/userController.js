import bcrypt from 'bcrypt';
import User from '../models/users.js';
import Player from '../models/players.js';
import Organization from '../models/orgs.js';
import Referee from '../models/referees.js';
import Role from '../models/roles.js';

// ========== AUTH ME ==========
export const authMe = async (req, res) => {
    // req.user đã được gắn từ middleware protectedRoute, đã có roles populated
    return res.status(200).json({
        message: "Lấy thông tin Auth thành công",
        user: req.user
    });
};

// ========== SEARCH USERS ==========
export const searchUsers = async (req, res) => {
    try {
        const { email, name } = req.query;
        if (!email && !name) {
            return res.status(400).json({ success: false, message: "Vui lòng cung cấp email hoặc name" });
        }

        // Tìm role 'player' để lấy _id
        const playerRole = await Role.findOne({ name: 'player' });
        if (!playerRole) {
            return res.status(500).json({ success: false, message: "Role 'player' chưa được khởi tạo" });
        }

        let searchQuery = { roles: playerRole._id };
        if (email) searchQuery.email = { $regex: email, $options: 'i' };
        if (name) {
            searchQuery.$or = [
                { username: { $regex: name, $options: 'i' } },
                { email: { $regex: name, $options: 'i' } },
            ];
        }

        const users = await User.find(searchQuery)
            .select('username email avatar roles _id')
            .populate('roles', 'name')
            .lean();

        const userIds = users.map(u => u._id);
        const players = await Player.find({ userId: { $in: userIds } }, 'name birthDate gender sports status userId').lean();
        const playerMap = {};
        players.forEach(p => { playerMap[p.userId.toString()] = p; });

        const result = users.map(u => ({
            ...u,
            roles: u.roles.map(r => r.name),
            playerInfo: playerMap[u._id.toString()] || null
        }));

        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ========== CHANGE PASSWORD ==========
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
            return res.status(400).json({ message: "Mật khẩu hiện tại không trùng khớp" });
        }

        user.hashedPassword = await bcrypt.hash(newPassword, 10);
        await user.save();

        return res.status(200).json({ message: "Đổi mật khẩu thành công" });
    } catch (error) {
        console.error("Lỗi trong hàm changePassword:", error);
        return res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
    }
};

// ========== GET PROFILE ==========
export const getProfile = async (req, res) => {
    try {
        const currentId = req.user._id;
        // Lấy user với roles populated
        const user = await User.findById(currentId)
            .select('-hashedPassword')
            .populate('roles', 'name');
        if (!user) {
            return res.status(401).json({ message: "Người dùng không tồn tại" });
        }

        // Lấy role đầu tiên (giả sử mỗi user có 1 role chính)
        const userRole = user.roles && user.roles.length > 0 ? user.roles[0].name : '';

        let profileDetails = null;
        if (userRole === 'player') {
            profileDetails = await Player.findOne({ userId: currentId });
        } else if (userRole === 'referee') {
            profileDetails = await Referee.findOne({ userId: currentId });
        } else if (userRole === 'org') {
            profileDetails = await Organization.findOne({ ownerId: currentId });
        }

        const userObject = user.toObject();
        const profileObject = profileDetails ? profileDetails.toObject() : {};

        const customData = {
            username: userObject.username,
            avatar: userObject.avatar || "",
            email: userObject.email,
            roles: userObject.roles.map(r => r.name),
            ...profileObject,
        };

        return res.status(200).json({
            message: "Lấy thông tin profile thành công",
            data: customData
        });
    } catch (error) {
        console.error("Lỗi trong hàm getProfile:", error);
        return res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
    }
};

// ========== EDIT PROFILE ==========
export const editProfile = async (req, res) => {
    try {
        const currentId = req.user._id;
        const { username, avatar, ...details } = req.body;

        const userUpdateData = {};
        if (username) userUpdateData.username = username;
        if (avatar) userUpdateData.avatar = avatar;

        const updatedUser = await User.findByIdAndUpdate(
            currentId,
            { $set: userUpdateData },
            { new: true, runValidators: true }
        ).select('-hashedPassword').populate('roles', 'name');

        if (!updatedUser) {
            return res.status(404).json({ message: "Người dùng không tồn tại" });
        }

        const userRole = updatedUser.roles && updatedUser.roles.length > 0 ? updatedUser.roles[0].name : '';

        let updatedDetails = null;
        if (userRole === 'player') {
            updatedDetails = await Player.findOneAndUpdate(
                { userId: currentId },
                { $set: details },
                { new: true, runValidators: true }
            );
        } else if (userRole === 'referee') {
            updatedDetails = await Referee.findOneAndUpdate(
                { userId: currentId },
                { $set: details },
                { new: true, runValidators: true }
            );
        } else if (userRole === 'org') {
            updatedDetails = await Organization.findOneAndUpdate(
                { ownerId: currentId },
                { $set: details },
                { new: true, runValidators: true }
            );
        }

        const userObject = updatedUser.toObject();
        const profileObject = updatedDetails ? updatedDetails.toObject() : {};

        const customData = {
            email: userObject.email,
            username: userObject.username,
            avatar: userObject.avatar,
            roles: userObject.roles.map(r => r.name),
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