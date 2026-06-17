// controllers/courtController.js
import mongoose from "mongoose";
import Court from "../models/courts.js";
import TournamentItem from "../models/tournamentItem.js";
import Tournament from "../models/tournaments.js";
import Organization from "../models/orgs.js";
import User from "../models/users.js";

/**
 * Kiểm tra user có quyền quản lý court của tournamentItem này không
 */
const canManageCourt = async (userId, tournamentItemId) => {
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
// Lấy danh sách sân theo tournamentItemId (có phân trang, lọc)
export const getCourtsByTournamentItem = async (req, res) => {
    try {
        const { tournamentItemId } = req.params;
        const { page = 1, limit = 20, status } = req.query;

        if (!mongoose.Types.ObjectId.isValid(tournamentItemId)) {
            return res.status(400).json({ success: false, message: "ID tournamentItem không hợp lệ" });
        }

        const filter = { tournamentItemId };
        if (status) filter.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = parseInt(limit);

        const [courts, total] = await Promise.all([
            Court.find(filter).skip(skip).limit(limitNum).sort({ createdAt: -1 }).lean(),
            Court.countDocuments(filter)
        ]);

        return res.status(200).json({
            success: true,
            data: courts,
            pagination: {
                page: parseInt(page),
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error("getCourtsByTournamentItem error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ========== CREATE ==========
export const addCourt = async (req, res) => {
    try {
        const { name, tournamentItemId, location } = req.body;
        const userId = req.user._id;

        if (!name || !tournamentItemId) {
            return res.status(400).json({ success: false, message: "Thiếu tên sân hoặc tournamentItemId" });
        }
        if (!mongoose.Types.ObjectId.isValid(tournamentItemId)) {
            return res.status(400).json({ success: false, message: "tournamentItemId không hợp lệ" });
        }

        // Kiểm tra quyền
        const hasPermission = await canManageCourt(userId, tournamentItemId);
        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền thêm sân cho giải đấu này"
            });
        }

        // Kiểm tra tên sân trùng trong cùng giải
        const existing = await Court.findOne({ name, tournamentItemId });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: "Tên sân đã tồn tại trong giải đấu này"
            });
        }

        const newCourt = await Court.create({
            name: name.trim(),
            tournamentItemId,
            location: location || '',
            status: 'empty'
        });

        return res.status(201).json({
            success: true,
            message: "Thêm sân thành công",
            data: newCourt
        });
    } catch (error) {
        console.error("addCourt error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ========== UPDATE ==========
export const updateCourt = async (req, res) => {
    try {
        const { courtId } = req.params;
        const { name, location } = req.body;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(courtId)) {
            return res.status(400).json({ success: false, message: "ID sân không hợp lệ" });
        }

        const court = await Court.findById(courtId);
        if (!court) {
            return res.status(404).json({ success: false, message: "Sân không tồn tại" });
        }

        // Kiểm tra quyền
        const hasPermission = await canManageCourt(userId, court.tournamentItemId);
        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền cập nhật sân này"
            });
        }

        if (name) court.name = name.trim();
        if (location !== undefined) court.location = location;

        await court.save();
        return res.status(200).json({
            success: true,
            message: "Cập nhật sân thành công",
            data: court
        });
    } catch (error) {
        console.error("updateCourt error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ========== UPDATE STATUS ==========
export const updateCourtStatus = async (req, res) => {
    try {
        const { courtId } = req.params;
        const { status } = req.body;
        const userId = req.user._id;

        const allowedStatus = ['empty', 'busy', 'maintenance', 'inactive'];
        if (!status || !allowedStatus.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Trạng thái không hợp lệ. Cho phép: ${allowedStatus.join(', ')}`
            });
        }

        const court = await Court.findById(courtId);
        if (!court) {
            return res.status(404).json({ success: false, message: "Sân không tồn tại" });
        }

        const hasPermission = await canManageCourt(userId, court.tournamentItemId);
        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền cập nhật sân này"
            });
        }

        court.status = status;
        await court.save();
        return res.status(200).json({
            success: true,
            message: "Cập nhật trạng thái sân thành công",
            data: court
        });
    } catch (error) {
        console.error("updateCourtStatus error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ========== DELETE ==========
export const deleteCourt = async (req, res) => {
    try {
        const { courtId } = req.params;
        const userId = req.user._id;

        const court = await Court.findById(courtId);
        if (!court) {
            return res.status(404).json({ success: false, message: "Sân không tồn tại" });
        }

        const hasPermission = await canManageCourt(userId, court.tournamentItemId);
        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền xóa sân này"
            });
        }

        await Court.findByIdAndDelete(courtId);
        return res.status(200).json({
            success: true,
            message: "Xóa sân thành công"
        });
    } catch (error) {
        console.error("deleteCourt error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};