import mongoose from "mongoose";
import Sponsor from "../models/sponsors.js";
import TournamentItem from "../models/tournamentItem.js";
import Tournament from "../models/tournaments.js";
import Organization from "../models/orgs.js";
import User from "../models/users.js";

/**
 * Kiểm tra user có quyền quản lý sponsor của tournamentItem này không
 */
const canManageSponsor = async (userId, tournamentItemId) => {
    // 1. Kiểm tra admin
    const user = await User.findById(userId).populate('roles');
    const isAdmin = user?.roles?.some(r => r.name === 'admin');
    if (isAdmin) return true;

    // 2. Tìm tournamentItem
    const tournamentItem = await TournamentItem.findById(tournamentItemId);
    if (!tournamentItem) return false;

    // 3. Tìm tổ chức của user
    const org = await Organization.findOne({ ownerId: userId });
    if (!org) return false;

    // 4. Nếu tournamentItem có tournamentId (hội thao)
    if (tournamentItem.tournamentId) {
        const tournament = await Tournament.findById(tournamentItem.tournamentId);
        if (tournament && tournament.organization) {
            return tournament.organization.toString() === org._id.toString();
        }
    }

    // 5. Nếu là giải đơn môn (tournamentId = null)
    if (tournamentItem.organization) {
        return tournamentItem.organization.toString() === org._id.toString();
    }

    return false;
};

// ========== GET ==========
// Lấy danh sách sponsor theo tournamentItemId (có phân trang, lọc)
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

// Lấy chi tiết sponsor theo id
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