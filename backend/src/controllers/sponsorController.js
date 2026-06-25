// controllers/sponsorController.js
import mongoose from "mongoose";
import Sponsor from "../models/sponsors.js";
import { checkTournamentItemPermission } from "../utils/tournamentHelper.js";

// ========== HELPERS ==========

/**
 * Kiểm tra quyền quản lý sponsor của tournamentItem
 */
const canManageSponsor = async (userId, tournamentItemId) => {
    const perm = await checkTournamentItemPermission(tournamentItemId, userId);
    return perm.allowed;
};

// ========== GET ==========

export const getSponsorsByTournamentItem = async (req, res) => {
    try {
        const { tournamentItemId } = req.params;
        const { page = 1, limit = 10, sponsorType, status } = req.query;

        if (!mongoose.Types.ObjectId.isValid(tournamentItemId)) {
            return res.status(400).json({ success: false, message: "ID tournamentItem không hợp lệ" });
        }

        const filter = { tournamentItemId };
        if (sponsorType) filter.sponsorType = sponsorType;
        if (status) filter.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = parseInt(limit);

        const [sponsors, total] = await Promise.all([
            Sponsor.find(filter).skip(skip).limit(limitNum).sort({ createdAt: -1 }).lean(),
            Sponsor.countDocuments(filter)
        ]);

        return res.status(200).json({
            success: true,
            data: sponsors,
            pagination: {
                page: parseInt(page),
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error("getSponsorsByTournamentItem error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getSponsorById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "ID không hợp lệ" });
        }
        const sponsor = await Sponsor.findById(id).lean();
        if (!sponsor) {
            return res.status(404).json({ success: false, message: "Không tìm thấy nhà tài trợ" });
        }
        return res.status(200).json({ success: true, data: sponsor });
    } catch (error) {
        console.error("getSponsorById error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ========== CREATE ==========

export const createSponsor = async (req, res) => {
    try {
        const userId = req.user._id;
        const {
            name,
            logo,
            website,
            tournamentItemId,
            sponsorType,
            sponsorshipType,
            amount,
            contactPerson,
            status
        } = req.body;

        // Validate
        if (!name || !tournamentItemId || amount === undefined) {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin bắt buộc: name, tournamentItemId, amount"
            });
        }
        if (!mongoose.Types.ObjectId.isValid(tournamentItemId)) {
            return res.status(400).json({ success: false, message: "tournamentItemId không hợp lệ" });
        }
        if (typeof amount !== 'number' || amount < 0) {
            return res.status(400).json({ success: false, message: "amount phải là số lớn hơn hoặc bằng 0" });
        }

        // Kiểm tra quyền
        const hasPermission = await canManageSponsor(userId, tournamentItemId);
        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền thêm nhà tài trợ cho giải đấu này"
            });
        }

        // Kiểm tra sponsorType hợp lệ
        const validSponsorTypes = ['Diamond', 'Gold', 'Silver', 'Bronze', 'Other'];
        if (sponsorType && !validSponsorTypes.includes(sponsorType)) {
            return res.status(400).json({
                success: false,
                message: `sponsorType không hợp lệ. Cho phép: ${validSponsorTypes.join(', ')}`
            });
        }

        // Kiểm tra sponsorshipType hợp lệ
        const validSponsorshipTypes = ['Money', 'Goods', 'Services'];
        if (sponsorshipType && !validSponsorshipTypes.includes(sponsorshipType)) {
            return res.status(400).json({
                success: false,
                message: `sponsorshipType không hợp lệ. Cho phép: ${validSponsorshipTypes.join(', ')}`
            });
        }

        // Kiểm tra status hợp lệ
        const validStatus = ['actived', 'inactived'];
        if (status && !validStatus.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `status không hợp lệ. Cho phép: ${validStatus.join(', ')}`
            });
        }

        // Kiểm tra contactPerson (nếu có)
        if (contactPerson && typeof contactPerson !== 'object') {
            return res.status(400).json({
                success: false,
                message: "contactPerson phải là object"
            });
        }

        const newSponsor = await Sponsor.create({
            name: name.trim(),
            logo: logo || "",
            website: website || "",
            tournamentItemId,
            sponsorType: sponsorType || "Gold",
            sponsorshipType: sponsorshipType || "Money",
            amount,
            contactPerson: contactPerson || { name: "", phone: "", email: "" },
            status: status || "active"
        });

        return res.status(201).json({
            success: true,
            message: "Thêm nhà tài trợ thành công",
            data: newSponsor
        });
    } catch (error) {
        console.error("createSponsor error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ========== UPDATE ==========

export const updateSponsor = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "ID không hợp lệ" });
        }

        const sponsor = await Sponsor.findById(id);
        if (!sponsor) {
            return res.status(404).json({ success: false, message: "Nhà tài trợ không tồn tại" });
        }

        // Kiểm tra quyền
        const hasPermission = await canManageSponsor(userId, sponsor.tournamentItemId);
        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền cập nhật nhà tài trợ này"
            });
        }

        const allowedUpdates = [
            "name", "logo", "website", "sponsorType",
            "sponsorshipType", "amount", "contactPerson", "status"
        ];
        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                sponsor[field] = req.body[field];
            }
        });

        // Validate lại các trường khi update
        if (req.body.sponsorType) {
            const validSponsorTypes = ['Diamond', 'Gold', 'Silver', 'Bronze', 'Other'];
            if (!validSponsorTypes.includes(req.body.sponsorType)) {
                return res.status(400).json({
                    success: false,
                    message: `sponsorType không hợp lệ. Cho phép: ${validSponsorTypes.join(', ')}`
                });
            }
        }
        if (req.body.sponsorshipType) {
            const validSponsorshipTypes = ['Money', 'Goods', 'Services'];
            if (!validSponsorshipTypes.includes(req.body.sponsorshipType)) {
                return res.status(400).json({
                    success: false,
                    message: `sponsorshipType không hợp lệ. Cho phép: ${validSponsorshipTypes.join(', ')}`
                });
            }
        }
        if (req.body.status) {
            const validStatus = ['active', 'inactive'];
            if (!validStatus.includes(req.body.status)) {
                return res.status(400).json({
                    success: false,
                    message: `status không hợp lệ. Cho phép: ${validStatus.join(', ')}`
                });
            }
        }
        if (req.body.amount !== undefined && (typeof req.body.amount !== 'number' || req.body.amount < 0)) {
            return res.status(400).json({
                success: false,
                message: "amount phải là số lớn hơn hoặc bằng 0"
            });
        }

        await sponsor.save();
        return res.status(200).json({
            success: true,
            message: "Cập nhật nhà tài trợ thành công",
            data: sponsor
        });
    } catch (error) {
        console.error("updateSponsor error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ========== DEACTIVATE ==========

export const deactivateSponsor = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const sponsor = await Sponsor.findById(id);
        if (!sponsor) {
            return res.status(404).json({ success: false, message: "Nhà tài trợ không tồn tại" });
        }

        const hasPermission = await canManageSponsor(userId, sponsor.tournamentItemId);
        if (!hasPermission) {
            return res.status(403).json({ success: false, message: "Bạn không có quyền" });
        }

        sponsor.status = "inactive";
        await sponsor.save();
        return res.status(200).json({
            success: true,
            message: "Đã vô hiệu hóa nhà tài trợ",
            data: sponsor
        });
    } catch (error) {
        console.error("deactivateSponsor error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ========== ACTIVATE ==========

export const activateSponsor = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const sponsor = await Sponsor.findById(id);
        if (!sponsor) {
            return res.status(404).json({ success: false, message: "Nhà tài trợ không tồn tại" });
        }

        const hasPermission = await canManageSponsor(userId, sponsor.tournamentItemId);
        if (!hasPermission) {
            return res.status(403).json({ success: false, message: "Bạn không có quyền" });
        }

        sponsor.status = "active";
        await sponsor.save();
        return res.status(200).json({
            success: true,
            message: "Đã kích hoạt lại nhà tài trợ",
            data: sponsor
        });
    } catch (error) {
        console.error("activateSponsor error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ========== DELETE ==========

export const deleteSponsor = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "ID không hợp lệ" });
        }

        const sponsor = await Sponsor.findById(id);
        if (!sponsor) {
            return res.status(404).json({ success: false, message: "Nhà tài trợ không tồn tại" });
        }

        const hasPermission = await canManageSponsor(userId, sponsor.tournamentItemId);
        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền xóa nhà tài trợ này"
            });
        }

        await Sponsor.findByIdAndDelete(id);
        return res.status(200).json({
            success: true,
            message: "Xóa nhà tài trợ thành công"
        });
    } catch (error) {
        console.error("deleteSponsor error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};