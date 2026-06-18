import User from "../models/users.js"
import Player from "../models/players.js"
import Organization from "../models/orgs.js"
import Referee from "../models/referees.js"

export const createProfileOrganization = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const { name, logo, website, contactEmail, address, contactPhone } = req.body;

        // Kiểm tra dữ liệu bắt buộc
        if (!name) {
            return res.status(400).json({ message: "Tên tổ chức là bắt buộc" });
        }

        // Kiểm tra user tồn tại
        const user = await User.findById(currentUserId);
        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy tài khoản" });
        }

        // Kiểm tra đã có tổ chức chưa
        const existingOrg = await Organization.findOne({ ownerId: currentUserId });
        if (existingOrg) {
            return res.status(409).json({
                message: `Bạn đã có tổ chức (${existingOrg.name}) với trạng thái: ${existingOrg.status}`
            });
        }

        // Tạo tổ chức mới
        const newOrg = new Organization({
            ownerId: currentUserId,
            name,
            logo: logo || "",
            website: website || "",
            contactEmail: contactEmail || user.email || "",
            address: {
                city: address?.city || "",
                district: address?.district || "",
                detail: address?.detail || ""
            },
            contactPhone: contactPhone || "",
            status: "pending", // mặc định chờ duyệt
            verifiedAt: null,
            verifiedBy: null
        });

        await newOrg.save();

        return res.status(201).json({
            message: "Tạo thông tin tổ chức thành công, vui lòng chờ admin duyệt",
            data: newOrg
        });
    } catch (error) {
        console.error("Lỗi trong createProfileOrganization:", error);
        return res.status(500).json({ message: error.message });
    }
};

// ========== CREATE PLAYER PROFILE ==========
export const createProfilePlayer = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const { name, birthDate, gender, sports,skill } = req.body;

        // Kiểm tra dữ liệu bắt buộc
        if (!name || !birthDate || !gender) {
            return res.status(400).json({ message: "Thiếu thông tin bắt buộc: name, birthDate, gender" });
        }

        // Kiểm tra user
        const user = await User.findById(currentUserId);
        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy tài khoản" });
        }

        // Kiểm tra đã có player chưa
        const existingPlayer = await Player.findOne({ userId: currentUserId });
        if (existingPlayer) {
            return res.status(409).json({
                message: `Bạn đã có profile player với trạng thái: ${existingPlayer.status}`
            });
        }

        // Tạo player mới
        const newPlayer = new Player({
            userId: currentUserId,
            name,
            birthDate: new Date(birthDate),
            gender,
            skill,
            sports: sports || [], // mảng { category, level, position }
            status: "actived" // trạng thái thi đấu, mặc định actived
        });

        await newPlayer.save();

        return res.status(201).json({
            message: "Tạo thông tin cầu thủ thành công, vui lòng chờ admin duyệt",
            data: newPlayer
        });
    } catch (error) {
        console.error("Lỗi trong createProfilePlayer:", error);
        return res.status(500).json({ message: error.message });
    }
};

// ========== CREATE REFEREE PROFILE ==========
export const createProfileReferee = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const { phoneNumber, name, birthDate, gender, category, yearsOfExperience } = req.body;

        // Kiểm tra dữ liệu bắt buộc
        if (!phoneNumber || !name || !birthDate || !gender) {
            return res.status(400).json({
                message: "Thiếu thông tin bắt buộc: phoneNumber, name, birthDate, gender"
            });
        }

        // Kiểm tra user
        const user = await User.findById(currentUserId);
        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy tài khoản" });
        }

        // Kiểm tra đã có referee chưa
        const existingReferee = await Referee.findOne({ userId: currentUserId });
        if (existingReferee) {
            return res.status(409).json({
                message: `Bạn đã có profile trọng tài với trạng thái: ${existingReferee.status}`
            });
        }

        // Tạo referee mới
        const newReferee = new Referee({
            userId: currentUserId,
            phoneNumber,
            name,
            birthDate: new Date(birthDate),
            gender,
            sports: [{
                category:category,
                yearsOfExperience: yearsOfExperience
            }], // mảng { category, yearsOfExperience }
            status: "pending", // chờ duyệt
            verifiedAt: null,
            verifiedBy: null
        });

        await newReferee.save();

        return res.status(201).json({
            message: "Tạo thông tin trọng tài thành công, vui lòng chờ admin duyệt",
            data: newReferee
        });
    } catch (error) {
        console.error("Lỗi trong createProfileReferee:", error);
        return res.status(500).json({ message: error.message });
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