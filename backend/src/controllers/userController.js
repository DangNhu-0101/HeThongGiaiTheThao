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

export const getUsers = async (req, res) => {
    try {
        const users = await User.find({})
            .select('-hashedPassword')
            .populate('roles', 'name')
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            data: users.map((user) => ({
                ...user,
                roles: user.roles.map((role) => role.name)
            }))
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const getRoleRequests = async (req, res) => {
    try {
        // Kiểm tra quyền admin (có thể dùng middleware riêng, nhưng ở đây kiểm tra lại)
        const adminRole = await Role.findOne({ name: 'admin' });
        if (!adminRole) {
            return res.status(500).json({ message: 'Admin role not found' });
        }
        const isAdmin = req.user.roles.some(r => r._id.equals(adminRole._id));
        if (!isAdmin) {
            return res.status(403).json({ message: 'Only admin can access this endpoint' });
        }

        const pendingUsers = await User.find({
            roleRequestStatus: 'pending',
            requestedRole: { $ne: null }
        })
            .select('-hashedPassword')
            .populate('roles', 'name')
            .sort({ createdAt: 1 })
            .lean();

        return res.status(200).json({
            success: true,
            data: pendingUsers.map(user => ({
                ...user,
                roles: user.roles.map(r => r.name)
            }))
        });
    } catch (error) {
        console.error('Get role requests error:', error);
        return res.status(500).json({ message: error.message });
    }
};

// Duyệt yêu cầu vai trò (đã có sẵn, nhưng ta sẽ bổ sung kiểm tra admin rõ ràng)
// Hàm approveRoleRequest đã có ở trên, chỉ cần thêm kiểm tra admin trước khi xử lý

export const approveRoleRequest = async (req, res) => {
    try {
        // Kiểm tra quyền admin
        const adminRole = await Role.findOne({ name: 'admin' });
        if (!adminRole) {
            return res.status(500).json({ message: 'Admin role not found' });
        }
        const isAdmin = req.user.roles.some(r => r._id.equals(adminRole._id));
        if (!isAdmin) {
            return res.status(403).json({ message: 'Only admin can approve role requests' });
        }

        // Phần logic duyệt như cũ
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        if (user.roleRequestStatus !== 'pending' || !user.requestedRole) {
            return res.status(400).json({ message: 'Người dùng không có yêu cầu vai trò đang chờ duyệt' });
        }

        const requestedRole = await Role.findOne({ name: user.requestedRole });
        if (!requestedRole) return res.status(500).json({ message: 'Vai trò yêu cầu chưa được khởi tạo' });

        const profile = user.requestedProfile || {};
        if (user.requestedRole === 'org') {
            await Organization.findOneAndUpdate(
                { ownerId: user._id },
                {
                    ownerId: user._id,
                    name: profile.orgName || profile.name || user.username,
                    contactEmail: user.email,
                    contactPhone: user.phoneNumber,
                    address: typeof profile.address === 'string' ? { detail: profile.address } : profile.address,
                    status: 'actived',
                    verifiedAt: new Date(),
                    verifiedBy: req.user._id
                },
                { upsert: true, new: true, runValidators: true }
            );
        } else if (user.requestedRole === 'referee') {
            await Referee.findOneAndUpdate(
                { userId: user._id },
                {
                    userId: user._id,
                    phoneNumber: user.phoneNumber,
                    name: profile.name || user.username,
                    birthDate: profile.birthDate || profile.birthDay,
                    gender: profile.gender,
                    sports: profile.sports || [{ yearsOfExperience: Number(profile.experienceYears || 0) }],
                    status: 'actived',
                    verifiedAt: new Date(),
                    verifiedBy: req.user._id
                },
                { upsert: true, new: true, runValidators: true }
            );
        }

        if (!user.roles.some((roleId) => roleId.equals(requestedRole._id))) {
            user.roles.push(requestedRole._id);
        }
        user.roleRequestStatus = 'approved';
        user.roleReviewedAt = new Date();
        user.roleReviewedBy = req.user._id;
        await user.save();

        const approvedUser = await User.findById(user._id)
            .select('-hashedPassword')
            .populate('roles', 'name')
            .lean();

        return res.status(200).json({
            message: `Đã duyệt vai trò ${user.requestedRole}`,
            data: { ...approvedUser, roles: approvedUser.roles.map((role) => role.name) }
        });
    } catch (error) {
        console.error('Approve role request error:', error);
        return res.status(500).json({ message: error.message });
    }
};

// Từ chối yêu cầu vai trò (admin)
export const rejectRoleRequest = async (req, res) => {
    try {
        // Kiểm tra quyền admin
        const adminRole = await Role.findOne({ name: 'admin' });
        if (!adminRole) {
            return res.status(500).json({ message: 'Admin role not found' });
        }
        const isAdmin = req.user.roles.some(r => r._id.equals(adminRole._id));
        if (!isAdmin) {
            return res.status(403).json({ message: 'Only admin can reject role requests' });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        if (user.roleRequestStatus !== 'pending' || !user.requestedRole) {
            return res.status(400).json({ message: 'Người dùng không có yêu cầu vai trò đang chờ duyệt' });
        }

        user.roleRequestStatus = 'rejected';
        user.roleReviewedAt = new Date();
        user.roleReviewedBy = req.user._id;
        // Xóa requestedRole nếu muốn
        user.requestedRole = null;
        user.requestedProfile = null;
        await user.save();

        return res.status(200).json({
            message: `Đã từ chối yêu cầu vai trò ${user.requestedRole}`
        });
    } catch (error) {
        console.error('Reject role request error:', error);
        return res.status(500).json({ message: error.message });
    }
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