// controllers/profileController.js
import User from "../models/users.js";
import Player from "../models/players.js";
import Organization from "../models/orgs.js";
import Referee from "../models/referees.js";
import Role from "../models/roles.js";

// ==================== ORGANIZATION ====================
export const createProfileOrganization = async (req, res) => {
    try {
        const userId = req.user._id;
        const { name, logo, website, contactEmail, address, contactPhone } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: "Tên tổ chức là bắt buộc" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản" });
        }

        const existingOrg = await Organization.findOne({ ownerId: userId });
        if (existingOrg) {
            return res.status(409).json({
                success: false,
                message: `Bạn đã có tổ chức (${existingOrg.name}) với trạng thái: ${existingOrg.status}`
            });
        }

        const orgRole = await Role.findOne({ name: 'org' });
        if (!orgRole) {
            return res.status(500).json({ success: false, message: "Role 'org' chưa được khởi tạo" });
        }

        const newOrg = new Organization({
            ownerId: userId,
            name: name.trim(),
            logo: logo || "",
            website: website || "",
            contactEmail: contactEmail || user.email || "",
            address: {
                city: address?.city || "",
                district: address?.district || "",
                detail: address?.detail || ""
            },
            contactPhone: contactPhone || "",
            status: 'actived',
            verifiedAt: new Date(),
            verifiedBy: null
        });
        await newOrg.save();

        if (!user.roles.some(r => r.toString() === orgRole._id.toString())) {
            user.roles.push(orgRole._id);
            await user.save();
        }

        return res.status(201).json({
            success: true,
            message: "Tạo profile tổ chức thành công",
            data: newOrg
        });
    } catch (error) {
        console.error("Lỗi trong createProfileOrganization:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getMyOrganization = async (req, res) => {
    try {
        const userId = req.user._id;
        const org = await Organization.findOne({ ownerId: userId });
        if (!org) {
            return res.status(404).json({ success: false, message: "Bạn chưa có tổ chức" });
        }
        return res.status(200).json({ success: true, data: org });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateProfileOrganization = async (req, res) => {
    try {
        const userId = req.user._id;
        const { name, logo, website, contactEmail, address, contactPhone } = req.body;

        const org = await Organization.findOne({ ownerId: userId });
        if (!org) {
            return res.status(404).json({ success: false, message: "Không tìm thấy tổ chức" });
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
        console.error("Lỗi trong updateProfileOrganization:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== PLAYER ====================
export const createProfilePlayer = async (req, res) => {
    try {
        const userId = req.user._id;
        const { name, birthDate, gender, sports } = req.body;

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

        const existingPlayer = await Player.findOne({ userId });
        if (existingPlayer) {
            return res.status(409).json({
                success: false,
                message: `Bạn đã có profile cầu thủ với trạng thái: ${existingPlayer.status}`
            });
        }

        const playerRole = await Role.findOne({ name: 'player' });
        if (!playerRole) {
            return res.status(500).json({ success: false, message: "Role 'player' chưa được khởi tạo" });
        }

        const newPlayer = new Player({
            userId,
            name: name.trim(),
            birthDate: new Date(birthDate),
            gender,
            sports: sports || [],
            status: 'active',
            verifiedAt: new Date(),
            verifiedBy: null,
            Status: 'actived'
        });
        await newPlayer.save();

        if (!user.roles.some(r => r.toString() === playerRole._id.toString())) {
            user.roles.push(playerRole._id);
            await user.save();
        }

        return res.status(201).json({
            success: true,
            message: "Tạo profile cầu thủ thành công",
            data: newPlayer
        });
    } catch (error) {
        console.error("Lỗi trong createProfilePlayer:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getMyPlayer = async (req, res) => {
    try {
        const userId = req.user._id;
        const player = await Player.findOne({ userId });
        if (!player) {
            return res.status(404).json({ success: false, message: "Bạn chưa có profile cầu thủ" });
        }
        return res.status(200).json({ success: true, data: player });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateProfilePlayer = async (req, res) => {
    try {
        const userId = req.user._id;
        const { name, birthDate, gender, sports, Status } = req.body;

        const player = await Player.findOne({ userId });
        if (!player) {
            return res.status(404).json({ success: false, message: "Không tìm thấy profile cầu thủ" });
        }

        if (name) player.name = name.trim();
        if (birthDate) player.birthDate = new Date(birthDate);
        if (gender) player.gender = gender;
        if (sports) player.sports = sports;
        if (Status) player.Status = Status;

        await player.save();
        return res.status(200).json({
            success: true,
            message: "Cập nhật profile cầu thủ thành công",
            data: player
        });
    } catch (error) {
        console.error("Lỗi trong updateProfilePlayer:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== REFEREE ====================
export const createProfileReferee = async (req, res) => {
    try {
        const userId = req.user._id;
        const { name, birthDate, gender, phoneNumber, sports } = req.body;

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

        const existingReferee = await Referee.findOne({ userId });
        if (existingReferee) {
            return res.status(409).json({
                success: false,
                message: `Bạn đã có profile trọng tài với trạng thái: ${existingReferee.status}`
            });
        }

        const refereeRole = await Role.findOne({ name: 'referee' });
        if (!refereeRole) {
            return res.status(500).json({ success: false, message: "Role 'referee' chưa được khởi tạo" });
        }

        const newReferee = new Referee({
            userId,
            name: name.trim(),
            birthDate: new Date(birthDate),
            gender,
            phoneNumber: phoneNumber || "",
            sports: sports || [],
            status: 'actived',
            verifiedAt: new Date(),
            verifiedBy: null
        });
        await newReferee.save();

        if (!user.roles.some(r => r.toString() === refereeRole._id.toString())) {
            user.roles.push(refereeRole._id);
            await user.save();
        }

        return res.status(201).json({
            success: true,
            message: "Tạo profile trọng tài thành công",
            data: newReferee
        });
    } catch (error) {
        console.error("Lỗi trong createProfileReferee:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getMyReferee = async (req, res) => {
    try {
        const userId = req.user._id;
        const referee = await Referee.findOne({ userId });
        if (!referee) {
            return res.status(404).json({ success: false, message: "Bạn chưa có profile trọng tài" });
        }
        return res.status(200).json({ success: true, data: referee });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateProfileReferee = async (req, res) => {
    try {
        const userId = req.user._id;
        const { name, birthDate, gender, phoneNumber, sports } = req.body;

        const referee = await Referee.findOne({ userId });
        if (!referee) {
            return res.status(404).json({ success: false, message: "Không tìm thấy profile trọng tài" });
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
        console.error("Lỗi trong updateProfileReferee:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};