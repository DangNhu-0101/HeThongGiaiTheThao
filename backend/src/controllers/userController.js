// controllers/userController.js
import bcrypt from 'bcrypt';
import User from '../models/users.js';
import Role from '../models/roles.js';
import Organization from '../models/orgs.js';
import Referee from '../models/referees.js';
import Player from '../models/players.js';

// ==================== USER SELF ====================
export const authMe = async (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Lấy thông tin Auth thành công",
        user: req.user
    });
};

export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-hashedPassword')
            .populate('roles', 'name');
        if (!user) {
            return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
        }

        // Lấy profile tương ứng nếu có
        let profile = null;
        const roleNames = user.roles.map(r => r.name);
        if (roleNames.includes('player')) {
            profile = await Player.findOne({ userId: user._id });
        } else if (roleNames.includes('org')) {
            profile = await Organization.findOne({ ownerId: user._id });
        } else if (roleNames.includes('referee')) {
            profile = await Referee.findOne({ userId: user._id });
        }

        const userData = user.toObject();
        delete userData.hashedPassword;
        return res.status(200).json({
            success: true,
            data: {
                ...userData,
                profile: profile || null
            }
        });
    } catch (error) {
        console.error("Lỗi getProfile:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const editProfile = async (req, res) => {
    try {
        const { username, avatar, email, phoneNumber } = req.body;
        const userId = req.user._id;

        const updateData = {};
        if (username) updateData.username = username;
        if (avatar !== undefined) updateData.avatar = avatar;
        if (email) updateData.email = email;
        if (phoneNumber) updateData.phoneNumber = phoneNumber;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ success: false, message: "Không có dữ liệu cập nhật" });
        }

        // Kiểm tra trùng email/phone
        if (email) {
            const existing = await User.findOne({ email, _id: { $ne: userId } });
            if (existing) {
                return res.status(409).json({ success: false, message: "Email đã được sử dụng" });
            }
        }
        if (phoneNumber) {
            const existing = await User.findOne({ phoneNumber, _id: { $ne: userId } });
            if (existing) {
                return res.status(409).json({ success: false, message: "Số điện thoại đã được sử dụng" });
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-hashedPassword').populate('roles', 'name');

        return res.status(200).json({
            success: true,
            message: "Cập nhật thông tin thành công",
            data: updatedUser
        });
    } catch (error) {
        console.error("Lỗi editProfile:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Vui lòng nhập mật khẩu hiện tại và mật khẩu mới" });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: "Mật khẩu mới ít nhất 6 ký tự" });
        }

        const user = await User.findById(req.user._id).select('+hashedPassword');
        const isMatch = await bcrypt.compare(currentPassword, user.hashedPassword);
        if (!isMatch) {
            return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });
        }

        user.hashedPassword = await bcrypt.hash(newPassword, 10);
        await user.save();
        return res.status(200).json({ success: true, message: "Đổi mật khẩu thành công" });
    } catch (error) {
        console.error("Lỗi changePassword:", error);
        return res.status(500).json({ message: error.message });
    }
};

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

        if (role) {
            const roleDoc = await Role.findOne({ name: role });
            if (roleDoc) {
                searchQuery.roles = roleDoc._id;
            }
        }

        const users = await User.find(searchQuery)
            .select('username email avatar phoneNumber roles')
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

// ==================== REQUEST ROLE (tạo profile pending) ====================
export const requestRole = async (req, res) => {
    try {
        const userId = req.user._id;
        const { roleType, profileData } = req.body; // roleType: 'org' hoặc 'referee'

        if (!roleType || !['org', 'referee'].includes(roleType)) {
            return res.status(400).json({ success: false, message: "roleType phải là 'org' hoặc 'referee'" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "Không tìm thấy user" });
        }

        // Kiểm tra xem đã có profile loại này chưa
        if (roleType === 'org') {
            const existing = await Organization.findOne({ ownerId: userId });
            if (existing) {
                return res.status(409).json({
                    success: false,
                    message: `Bạn đã có tổ chức với trạng thái: ${existing.status}`
                });
            }
            // Tạo mới Organization với status pending
            const newOrg = new Organization({
                ownerId: userId,
                name: profileData.name,
                logo: profileData.logo || '',
                website: profileData.website || '',
                contactEmail: profileData.contactEmail || user.email,
                address: {
                    city: profileData.address?.city || '',
                    district: profileData.address?.district || '',
                    detail: profileData.address?.detail || ''
                },
                contactPhone: profileData.contactPhone || '',
                status: 'pending',
                verifiedAt: null,
                verifiedBy: null
            });
            await newOrg.save();

            // Lưu thông tin yêu cầu vào user (để admin biết)
            user.requestedRole = 'org';
            user.roleRequestStatus = 'pending';
            user.requestedProfile = profileData;
            user.roleRequestedAt = new Date();
            await user.save();

            return res.status(201).json({
                success: true,
                message: "Yêu cầu tạo tổ chức đã được gửi, chờ admin duyệt",
                data: newOrg
            });

        } else if (roleType === 'referee') {
            const existing = await Referee.findOne({ userId });
            if (existing) {
                return res.status(409).json({
                    success: false,
                    message: `Bạn đã có profile trọng tài với trạng thái: ${existing.status}`
                });
            }

            const newReferee = new Referee({
                userId,
                name: profileData.name,
                birthDate: profileData.birthDate,
                gender: profileData.gender,
                phoneNumber: profileData.phoneNumber || '',
                sports: profileData.sports || [],
                status: 'pending',
                verifiedAt: null,
                verifiedBy: null
            });
            await newReferee.save();

            user.requestedRole = 'referee';
            user.roleRequestStatus = 'pending';
            user.requestedProfile = profileData;
            user.roleRequestedAt = new Date();
            await user.save();

            return res.status(201).json({
                success: true,
                message: "Yêu cầu tạo profile trọng tài đã được gửi, chờ admin duyệt",
                data: newReferee
            });
        }
    } catch (error) {
        console.error("Lỗi requestRole:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== ADMIN: QUẢN LÝ YÊU CẦU ROLE ====================
export const getPendingRequests = async (req, res) => {
    try {
        const { type } = req.query; // 'org' hoặc 'referee'
        let results = [];

        if (!type || type === 'org') {
            const orgs = await Organization.find({ status: 'pending' })
                .populate('ownerId', 'username email phoneNumber');
            results = results.concat(orgs.map(o => ({ ...o.toObject(), profileType: 'org' })));
        }
        if (!type || type === 'referee') {
            const referees = await Referee.find({ status: 'pending' })
                .populate('userId', 'username email phoneNumber');
            results = results.concat(referees.map(r => ({ ...r.toObject(), profileType: 'referee' })));
        }

        return res.status(200).json({
            success: true,
            count: results.length,
            data: results
        });
    } catch (error) {
        console.error("Lỗi getPendingRequests:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const approveOrganization = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user._id;

        const org = await Organization.findById(id);
        if (!org) {
            return res.status(404).json({ success: false, message: "Không tìm thấy tổ chức" });
        }
        if (org.status !== 'pending') {
            return res.status(400).json({ success: false, message: `Tổ chức đang ở trạng thái ${org.status}` });
        }

        // Cập nhật status
        org.status = 'actived';
        org.verifiedAt = new Date();
        org.verifiedBy = adminId;
        await org.save();

        // Gán role org cho user
        const user = await User.findById(org.ownerId);
        if (user) {
            const orgRole = await Role.findOne({ name: 'org' });
            if (orgRole && !user.roles.some(r => r.toString() === orgRole._id.toString())) {
                user.roles.push(orgRole._id);
            }
            user.roleRequestStatus = 'approved';
            user.roleReviewedAt = new Date();
            user.roleReviewedBy = adminId;
            user.requestedRole = null;
            user.requestedProfile = null;
            await user.save();
        }

        return res.status(200).json({
            success: true,
            message: "Duyệt tổ chức thành công",
            data: org
        });
    } catch (error) {
        console.error("Lỗi approveOrganization:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const approveReferee = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user._id;

        const referee = await Referee.findById(id);
        if (!referee) {
            return res.status(404).json({ success: false, message: "Không tìm thấy trọng tài" });
        }
        if (referee.status !== 'pending') {
            return res.status(400).json({ success: false, message: `Trọng tài đang ở trạng thái ${referee.status}` });
        }

        referee.status = 'actived';
        referee.verifiedAt = new Date();
        referee.verifiedBy = adminId;
        await referee.save();

        const user = await User.findById(referee.userId);
        if (user) {
            const refRole = await Role.findOne({ name: 'referee' });
            if (refRole && !user.roles.some(r => r.toString() === refRole._id.toString())) {
                user.roles.push(refRole._id);
            }
            user.roleRequestStatus = 'approved';
            user.roleReviewedAt = new Date();
            user.roleReviewedBy = adminId;
            user.requestedRole = null;
            user.requestedProfile = null;
            await user.save();
        }

        return res.status(200).json({
            success: true,
            message: "Duyệt trọng tài thành công",
            data: referee
        });
    } catch (error) {
        console.error("Lỗi approveReferee:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const rejectRequest = async (req, res) => {
    try {
        const { type, id } = req.params; // type: 'org' hoặc 'referee'

        let profile, userId;
        if (type === 'org') {
            profile = await Organization.findById(id);
            if (profile) userId = profile.ownerId;
        } else if (type === 'referee') {
            profile = await Referee.findById(id);
            if (profile) userId = profile.userId;
        } else {
            return res.status(400).json({ success: false, message: "Loại không hợp lệ" });
        }

        if (!profile) {
            return res.status(404).json({ success: false, message: "Không tìm thấy profile" });
        }

        // Có thể xóa hoặc chuyển status rejected. Tôi chọn chuyển status.
        profile.status = 'rejected';
        await profile.save();

        // Cập nhật user
        if (userId) {
            const user = await User.findById(userId);
            if (user) {
                user.roleRequestStatus = 'rejected';
                user.roleReviewedAt = new Date();
                user.roleReviewedBy = req.user._id;
                user.requestedRole = null;
                user.requestedProfile = null;
                await user.save();
            }
        }

        return res.status(200).json({
            success: true,
            message: `Đã từ chối yêu cầu ${type}`,
            data: profile
        });
    } catch (error) {
        console.error("Lỗi rejectRequest:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== ADMIN: QUẢN LÝ USER ====================
export const getUsers = async (req, res) => {
    try {
        const users = await User.find({})
            .select('-hashedPassword')
            .populate('roles', 'name')
            .sort({ createdAt: -1 })
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

export const getUserDetail = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-hashedPassword')
            .populate('roles', 'name')
            .lean();
        if (!user) {
            return res.status(404).json({ success: false, message: "Không tìm thấy user" });
        }

        // Lấy profile
        let profile = null;
        const roleNames = user.roles.map(r => r.name);
        if (roleNames.includes('player')) {
            profile = await Player.findOne({ userId: user._id });
        } else if (roleNames.includes('org')) {
            profile = await Organization.findOne({ ownerId: user._id });
        } else if (roleNames.includes('referee')) {
            profile = await Referee.findOne({ userId: user._id });
        }

        return res.status(200).json({
            success: true,
            data: {
                ...user,
                roles: roleNames,
                profile
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateUserByAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, roles, username, email, phoneNumber } = req.body;

        const updateData = {};
        if (status) updateData.status = status;
        if (username) updateData.username = username;
        if (email) updateData.email = email;
        if (phoneNumber) updateData.phoneNumber = phoneNumber;

        if (roles) {
            // roles là mảng tên role, ví dụ ['org', 'referee']
            const roleDocs = await Role.find({ name: { $in: roles } });
            updateData.roles = roleDocs.map(r => r._id);
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-hashedPassword').populate('roles', 'name');

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "Không tìm thấy user" });
        }

        return res.status(200).json({
            success: true,
            message: "Cập nhật user thành công",
            data: updatedUser
        });
    } catch (error) {
        console.error("Lỗi updateUserByAdmin:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({ success: false, message: "Không tìm thấy user" });
        }

        // Xóa profile liên quan
        await Player.deleteOne({ userId: id });
        await Organization.deleteOne({ ownerId: id });
        await Referee.deleteOne({ userId: id });

        return res.status(200).json({
            success: true,
            message: "Xóa user và profile thành công"
        });
    } catch (error) {
        console.error("Lỗi deleteUser:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== UPDATE PROFILE (chi tiết) ====================
// Cập nhật profile Organization (đã có, thêm logic kiểm tra status)
export const updateOrganization = async (req, res) => {
    try {
        const userId = req.user._id;
        const { name, logo, website, contactEmail, address, contactPhone } = req.body;

        const org = await Organization.findOne({ ownerId: userId });
        if (!org) {
            return res.status(404).json({ success: false, message: "Không tìm thấy tổ chức" });
        }

        // Không cho sửa nếu đã bị từ chối hoặc đang pending? (có thể cho sửa)
        if (org.status === 'rejected') {
            // Nếu đã bị từ chối, việc cập nhật sẽ reset về pending để gửi duyệt lại
            org.status = 'pending';
        }

        if (name) org.name = name.trim();
        if (logo !== undefined) org.logo = logo;
        if (website !== undefined) org.website = website;
        if (contactEmail) org.contactEmail = contactEmail;
        if (address) {
            org.address.city = address.city || org.address.city;
            org.address.district = address.district || org.address.district;
            org.address.detail = address.detail || org.address.detail;
        }
        if (contactPhone !== undefined) org.contactPhone = contactPhone;

        await org.save();
        return res.status(200).json({
            success: true,
            message: "Cập nhật tổ chức thành công",
            data: org
        });
    } catch (error) {
        console.error("Lỗi updateOrganization:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Cập nhật profile Player
export const updatePlayer = async (req, res) => {
    try {
        const userId = req.user._id;
        const { name, birthDate, gender, sports } = req.body;

        const player = await Player.findOne({ userId });
        if (!player) {
            return res.status(404).json({ success: false, message: "Không tìm thấy profile cầu thủ" });
        }

        if (name) player.name = name.trim();
        if (birthDate) player.birthDate = new Date(birthDate);
        if (gender) player.gender = gender;
        if (sports) player.sports = sports;

        await player.save();
        return res.status(200).json({
            success: true,
            message: "Cập nhật profile cầu thủ thành công",
            data: player
        });
    } catch (error) {
        console.error("Lỗi updatePlayer:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Cập nhật profile Referee
export const updateReferee = async (req, res) => {
    try {
        const userId = req.user._id;
        const { name, birthDate, gender, phoneNumber, sports } = req.body;

        const referee = await Referee.findOne({ userId });
        if (!referee) {
            return res.status(404).json({ success: false, message: "Không tìm thấy profile trọng tài" });
        }

        if (referee.status === 'rejected') {
            referee.status = 'pending'; // reset để gửi duyệt lại
        }

        if (name) referee.name = name.trim();
        if (birthDate) referee.birthDate = new Date(birthDate);
        if (gender) referee.gender = gender;
        if (phoneNumber !== undefined) referee.phoneNumber = phoneNumber;
        if (sports) referee.sports = sports;

        await referee.save();
        return res.status(200).json({
            success: true,
            message: "Cập nhật profile trọng tài thành công",
            data: referee
        });
    } catch (error) {
        console.error("Lỗi updateReferee:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};


export const createPlayerProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { name, birthDate, gender, sports } = req.body;

        // Validate
        if (!name || !birthDate || !gender) {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin bắt buộc: name, birthDate, gender"
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản" });
        }

        // Kiểm tra đã có profile player chưa
        const existingPlayer = await Player.findOne({ userId });
        if (existingPlayer) {
            return res.status(409).json({
                success: false,
                message: `Bạn đã có profile cầu thủ với trạng thái: ${existingPlayer.status}`
            });
        }

        // Tạo mới Player (active luôn)
        const newPlayer = new Player({
            userId,
            name: name.trim(),
            birthDate: new Date(birthDate),
            gender,
            sports: sports || [],
            status: 'active',
            verifiedAt: new Date(),
            verifiedBy: null
        });
        await newPlayer.save();

        // Đảm bảo user có role player (nếu chưa có)
        const playerRole = await Role.findOne({ name: 'player' });
        if (playerRole && !user.roles.some(r => r.toString() === playerRole._id.toString())) {
            user.roles.push(playerRole._id);
            await user.save();
        }

        return res.status(201).json({
            success: true,
            message: "Tạo profile cầu thủ thành công",
            data: newPlayer
        });
    } catch (error) {
        console.error("Lỗi createPlayerProfile:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};