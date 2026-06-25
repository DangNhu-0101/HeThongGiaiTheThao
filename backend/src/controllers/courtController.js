// controllers/courtController.js
import mongoose from "mongoose";
import Court from "../models/courts.js";
import TournamentItem from "../models/tournamentItem.js";
import Tournament from "../models/tournaments.js";
import { checkTournamentItemPermission, checkPermission } from "../utils/tournamentHelper.js";

// ========== HELPERS ==========

/**
 * Kiểm tra quyền quản lý court của tournamentItem
 * - User phải là admin hoặc owner của tournamentItem
 */
const canManageCourt = async (userId, tournamentItemId) => {
    const perm = await checkTournamentItemPermission(tournamentItemId, userId);
    return perm.allowed;
};

// ========== GET ==========
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

        // Kiểm tra tên sân trùng
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

export const getCourtById = async (req, res) => {
    try {
        const { courtId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(courtId)) {
            return res.status(400).json({ success: false, message: "ID sân không hợp lệ" });
        }
        const court = await Court.findById(courtId).lean();
        if (!court) {
            return res.status(404).json({ success: false, message: "Sân không tồn tại" });
        }
        return res.status(200).json({ success: true, data: court });
    } catch (error) {
        console.error("getCourtById error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};