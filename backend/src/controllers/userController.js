// controllers/userController.js (hoặc authController.js)
import bcrypt from 'bcrypt';
import User from '../models/users.js';
import Role from '../models/roles.js';

// ========== AUTH ME ==========
export const authMe = async (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Lấy thông tin Auth thành công",
        user: req.user
    });
};

// ========== SEARCH USERS ==========
export const searchUsers = async (req, res) => {
    try {
        const { email, name, role } = req.query;
        if (!email && !name) {
            return res.status(400).json({ success: false, message: "Vui lòng cung cấp email hoặc name" });
        }

        let searchQuery = {};
        if (email) searchQuery.email = { $regex: email, $options: 'i' };
        if (name) {
            searchQuery.$or = [
                { username: { $regex: name, $options: 'i' } },
                { email: { $regex: name, $options: 'i' } },
            ];
        }

        // Nếu có filter role, lọc theo role
        if (role) {
            const roleDoc = await Role.findOne({ name: role });
            if (roleDoc) {
                searchQuery.roles = roleDoc._id;
            }
        }

        const users = await User.find(searchQuery)
            .select('username email avatar phoneNumber roles _id')
            .populate('roles', 'name')
            .lean();

        const result = users.map(u => ({
            ...u,
            roles: u.roles.map(r => r.name)
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

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới" });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
        }

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

        return res.status(200).json({ success: true, message: "Đổi mật khẩu thành công" });
    } catch (error) {
        console.error("Lỗi trong hàm changePassword:", error);
        return res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
    }
};

// ========== GET PROFILE ==========
export const getProfile = async (req, res) => {
    try {
        const currentId = req.user._id;
        const user = await User.findById(currentId)
            .select('-hashedPassword')
            .populate('roles', 'name');
        if (!user) {
            return res.status(401).json({ message: "Người dùng không tồn tại" });
        }

        const userObject = user.toObject();
        const customData = {
            _id: userObject._id,
            username: userObject.username,
            email: userObject.email,
            phoneNumber: userObject.phoneNumber,
            avatar: userObject.avatar || "",
            roles: userObject.roles.map(r => r.name),
            status: userObject.status,
            createdAt: userObject.createdAt,
            updatedAt: userObject.updatedAt
        };

        return res.status(200).json({
            success: true,
            message: "Lấy thông tin profile thành công",
            data: customData
        });
    } catch (error) {
        console.error("Lỗi trong hàm getProfile:", error);
        return res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
    }
};

// ========== EDIT PROFILE (chỉ username, avatar, email, phoneNumber) ==========
export const editProfile = async (req, res) => {
    try {
        const currentId = req.user._id;
        const { username, avatar, email, phoneNumber } = req.body;

        const updateData = {};
        if (username) updateData.username = username;
        if (avatar !== undefined) updateData.avatar = avatar;
        if (email) updateData.email = email;
        if (phoneNumber) updateData.phoneNumber = phoneNumber;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Không có thông tin nào để cập nhật"
            });
        }

        // Kiểm tra email hoặc phoneNumber đã tồn tại chưa
        if (email) {
            const existingUser = await User.findOne({ email, _id: { $ne: currentId } });
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: "Email đã được sử dụng bởi tài khoản khác"
                });
            }
        }
        if (phoneNumber) {
            const existingUser = await User.findOne({ phoneNumber, _id: { $ne: currentId } });
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: "Số điện thoại đã được sử dụng bởi tài khoản khác"
                });
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            currentId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-hashedPassword').populate('roles', 'name');

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "Người dùng không tồn tại" });
        }

        const userObject = updatedUser.toObject();
        const customData = {
            _id: userObject._id,
            username: userObject.username,
            email: userObject.email,
            phoneNumber: userObject.phoneNumber,
            avatar: userObject.avatar || "",
            roles: userObject.roles.map(r => r.name),
            status: userObject.status,
            createdAt: userObject.createdAt,
            updatedAt: userObject.updatedAt
        };

        return res.status(200).json({
            success: true,
            message: "Cập nhật thông tin cá nhân thành công",
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