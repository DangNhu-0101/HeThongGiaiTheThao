// controllers/userController.js
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import User from '../models/users.js';
import Role from '../models/roles.js';
import Organization from '../models/orgs.js';
import Referee from '../models/referees.js';
import Player from '../models/players.js';
import Session from '../models/session.js';
import PasswordResetToken from '../models/passwordResetTokens.js';
import { sendPasswordResetCode } from '../services/mailService.js';

const ROLE_GRANT_CONFIG = {
    player: {
        roleName: 'player',
        displayName: 'Cầu thủ',
        permissions: ['view_tournament', 'join_team'],
        validStatuses: ['actived', 'active', 'approved']
    },
    organization: {
        roleName: 'organization',
        displayName: 'Ban tổ chức',
        permissions: ['create_tournament', 'manage_tournament'],
        validStatuses: ['actived', 'active', 'approved']
    },
    referee: {
        roleName: 'referee',
        displayName: 'Trọng tài',
        permissions: ['view_tournament', 'enter_match_result'],
        validStatuses: ['actived', 'active', 'approved']
    }
};

const ensureRole = async (roleName) => {
    const config = Object.values(ROLE_GRANT_CONFIG).find(item => item.roleName === roleName);
    if (!config) throw new Error(`Không hỗ trợ role ${roleName}`);

    return Role.findOneAndUpdate(
        { name: roleName },
        {
            name: roleName,
            displayName: config.displayName,
            permissions: config.permissions,
            isDefault: false
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
};

const addRoleToUserIfMissing = async (user, roleName) => {
    const role = await ensureRole(roleName);
    if (!user.roles.some(existingRole => {
        const roleId = existingRole?._id || existingRole;
        const currentName = existingRole?.name;
        return roleId?.toString() === role._id.toString() || currentName === roleName;
    })) {
        user.roles.push(role._id);
        return true;
    }
    return false;
};

const syncApprovedProfileRoles = async (user, profilesByType = {}) => {
    if (!user) return user;

    let changed = false;
    for (const [type, profile] of Object.entries(profilesByType)) {
        const config = ROLE_GRANT_CONFIG[type];
        if (!config || !profile || !config.validStatuses.includes(profile.status)) continue;
        changed = await addRoleToUserIfMissing(user, config.roleName) || changed;
    }

    if (changed) {
        await user.save();
        return User.findById(user._id).select('-hashedPassword').populate('roles', 'name displayName permissions');
    }

    return user;
};

// ==================== USER SELF ====================
export const authMe = async (req, res) => {
    const [playerProfile, organizationProfile, refereeProfile] = await Promise.all([
        Player.findOne({ userId: req.user._id }).lean(),
        Organization.findOne({ ownerId: req.user._id }).lean(),
        Referee.findOne({ userId: req.user._id }).lean()
    ]);
    const user = await syncApprovedProfileRoles(req.user, {
        player: playerProfile,
        organization: organizationProfile,
        referee: refereeProfile
    });

    return res.status(200).json({
        success: true,
        message: "Lấy thông tin Auth thành công",
        user
    });
};

export const getProfile = async (req, res) => {
    try {
        let user = await User.findById(req.user._id)
            .select('-hashedPassword')
            .populate('roles', 'name');
        if (!user) {
            return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
        }

        const [playerProfile, organizationProfile, refereeProfile] = await Promise.all([
            Player.findOne({ userId: user._id }).lean(),
            Organization.findOne({ ownerId: user._id }).lean(),
            Referee.findOne({ userId: user._id }).lean()
        ]);

        user = await syncApprovedProfileRoles(user, {
            player: playerProfile,
            organization: organizationProfile,
            referee: refereeProfile
        });

        const profiles = [];
        if (playerProfile) profiles.push({ ...playerProfile, type: 'player' });
        if (organizationProfile) profiles.push({ ...organizationProfile, type: 'organization' });
        if (refereeProfile) profiles.push({ ...refereeProfile, type: 'referee' });

        const userData = user.toObject();
        delete userData.hashedPassword;

        return res.status(200).json({
            success: true,
            data: {
                ...userData,
                profile: playerProfile || organizationProfile || refereeProfile || null,
                playerProfile: playerProfile || null,
                player: playerProfile || null,
                organizationProfile: organizationProfile || null,
                organization: organizationProfile || null,
                refereeProfile: refereeProfile || null,
                referee: refereeProfile || null,
                profiles
            }
        });
    } catch (error) {
        console.error("Lỗi getProfile:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
export const editProfile = async (req, res) => {
    try {
        const { username, avatar, email, phoneNumber, fullName, birthDate, gender, address, bio } = req.body;
        const userId = req.user._id;

        const updateData = {};
        if (username) updateData.username = username;
        if (avatar !== undefined) updateData.avatar = avatar;
        if (email) updateData.email = email;
        if (phoneNumber) updateData.phoneNumber = phoneNumber;
        if (fullName !== undefined) updateData.fullName = String(fullName).trim();
        if (birthDate !== undefined) updateData.birthDate = birthDate ? new Date(birthDate) : null;
        if (gender !== undefined && ['male', 'female', 'other', ''].includes(gender)) updateData.gender = gender;
        if (address !== undefined) updateData.address = String(address).trim();
        if (bio !== undefined) updateData.bio = String(bio).trim().slice(0, 1000);

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
            { returnDocument: 'after', runValidators: true }
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

const PASSWORD_CHANGE_TTL_MINUTES = Number(process.env.PASSWORD_CHANGE_CODE_TTL_MINUTES || 10);
const PASSWORD_CHANGE_MAX_ATTEMPTS = Number(process.env.PASSWORD_CHANGE_MAX_ATTEMPTS || 5);
const PASSWORD_CHANGE_RESEND_COOLDOWN_SECONDS = Number(process.env.PASSWORD_CHANGE_RESEND_COOLDOWN_SECONDS || 60);
const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');
const createSixDigitCode = () => String(crypto.randomInt(100000, 1000000));

export const requestChangePasswordOtp = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });

        const recentToken = await PasswordResetToken.findOne({
            userId: user._id,
            email: user.email,
            usedAt: null,
            createdAt: { $gt: new Date(Date.now() - PASSWORD_CHANGE_RESEND_COOLDOWN_SECONDS * 1000) },
        }).sort({ createdAt: -1 });
        if (recentToken) {
            return res.status(429).json({ success: false, message: 'Vui lòng chờ trước khi gửi lại mã xác minh.' });
        }

        await PasswordResetToken.updateMany(
            { userId: user._id, email: user.email, usedAt: null },
            { $set: { usedAt: new Date() } }
        );

        const code = createSixDigitCode();
        const token = await PasswordResetToken.create({
            userId: user._id,
            email: user.email,
            codeHash: sha256(code),
            expiresAt: new Date(Date.now() + PASSWORD_CHANGE_TTL_MINUTES * 60 * 1000),
        });

        try {
            await sendPasswordResetCode({ to: user.email, code, ttlMinutes: PASSWORD_CHANGE_TTL_MINUTES });
        } catch (mailError) {
            await PasswordResetToken.deleteOne({ _id: token._id });
            console.error('SMTP gửi OTP đổi mật khẩu thất bại:', { userId: String(user._id), email: user.email, error: mailError.message });
            return res.status(503).json({ success: false, message: 'Không thể gửi email xác minh. Vui lòng kiểm tra địa chỉ email hoặc thử lại sau.' });
        }
        return res.json({
            success: true,
            message: 'Mã xác minh đã được gửi đến email của bạn',
            expiresInSeconds: PASSWORD_CHANGE_TTL_MINUTES * 60,
            resendAfterSeconds: PASSWORD_CHANGE_RESEND_COOLDOWN_SECONDS
        });
    } catch (error) {
        console.error('Lỗi gửi OTP đổi mật khẩu:', error);
        return res.status(500).json({ success: false, message: 'Không thể gửi mã xác minh. Vui lòng thử lại sau.' });
    }
};

export const verifyChangePasswordOtp = async (req, res) => {
    try {
        const code = String(req.body.code || '').trim();
        if (!/^\d{6}$/.test(code)) {
            return res.status(400).json({ success: false, message: 'Mã xác minh không hợp lệ' });
        }

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });

        const token = await PasswordResetToken.findOne({
            userId: user._id,
            email: user.email,
            usedAt: null,
            expiresAt: { $gt: new Date() },
        }).sort({ createdAt: -1 });
        if (!token) return res.status(400).json({ success: false, message: 'Mã xác minh không hợp lệ hoặc đã hết hạn' });
        if (token.attempts >= PASSWORD_CHANGE_MAX_ATTEMPTS) {
            token.usedAt = new Date();
            await token.save();
            return res.status(429).json({ success: false, message: 'Mã xác minh đã bị khóa do nhập sai quá nhiều lần' });
        }
        if (token.codeHash !== sha256(code)) {
            token.attempts += 1;
            await token.save();
            return res.status(400).json({ success: false, message: 'Mã xác minh không hợp lệ hoặc đã hết hạn' });
        }

        token.verifiedAt = new Date();
        await token.save();
        return res.json({ success: true, message: 'Xác minh thành công' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const confirmChangePassword = async (req, res) => {
    try {
        const code = String(req.body.code || '').trim();
        const newPassword = String(req.body.newPassword || '');
        if (!/^\d{6}$/.test(code) || newPassword.length < 8) {
            return res.status(400).json({ success: false, message: 'Mã xác minh hoặc mật khẩu mới không hợp lệ' });
        }

        const user = await User.findById(req.user._id).select('+hashedPassword');
        if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });

        const token = await PasswordResetToken.findOne({
            userId: user._id,
            email: user.email,
            usedAt: null,
            expiresAt: { $gt: new Date() },
        }).sort({ createdAt: -1 });
        if (!token || token.codeHash !== sha256(code) || !token.verifiedAt) {
            return res.status(400).json({ success: false, message: 'Phiên xác minh không hợp lệ hoặc đã hết hạn' });
        }

        user.hashedPassword = await bcrypt.hash(newPassword, 10);
        token.usedAt = new Date();
        await Promise.all([
            user.save(),
            token.save(),
            Session.deleteMany({ userId: user._id, refreshToken: { $ne: req.cookies?.refreshToken || '' } })
        ]);

        return res.json({ success: true, message: 'Đổi mật khẩu thành công' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: "Vui lòng nhập đầy đủ mật khẩu hiện tại, mật khẩu mới và xác nhận mật khẩu" });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 8 ký tự" });
        }
        if (newPassword !== confirmPassword) return res.status(400).json({ message: "Mật khẩu xác nhận không khớp" });

        const user = await User.findById(req.user._id).select('+hashedPassword');
        const isMatch = await bcrypt.compare(currentPassword, user.hashedPassword);
        if (!isMatch) {
            return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });
        }
        if (await bcrypt.compare(newPassword, user.hashedPassword)) return res.status(400).json({ message: "Mật khẩu mới phải khác mật khẩu hiện tại" });

        user.hashedPassword = await bcrypt.hash(newPassword, 10);
        await Promise.all([user.save(), Session.deleteMany({ userId: user._id, refreshToken: { $ne: req.cookies?.refreshToken || '' } })]);
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

const grantApprovedRoleToUser = async ({ userId, roleName, adminId }) => {
    const user = await User.findById(userId);
    if (!user) return null;

    await addRoleToUserIfMissing(user, roleName);

    user.roleRequestStatus = 'approved';
    user.roleReviewedAt = new Date();
    user.roleReviewedBy = adminId;
    user.requestedRole = null;
    user.requestedProfile = null;
    await user.save();

    return User.findById(user._id)
        .select('-hashedPassword')
        .populate('roles', 'name displayName permissions');
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

        const user = await grantApprovedRoleToUser({
            userId: org.ownerId,
            roleName: 'organization',
            adminId
        });

        return res.status(200).json({
            success: true,
            message: "Duyệt tổ chức thành công",
            data: org,
            user
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

        const user = await grantApprovedRoleToUser({
            userId: referee.userId,
            roleName: 'referee',
            adminId
        });

        return res.status(200).json({
            success: true,
            message: "Duyệt trọng tài thành công",
            data: referee,
            user
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
        } else if (roleNames.includes('org') || roleNames.includes('organization')) {
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
            { returnDocument: 'after', runValidators: true }
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
        const skill = req.body.skill || 2.5; // default skill

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
            skill: skill,
            sports: sports || [],
            status: 'actived',
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
