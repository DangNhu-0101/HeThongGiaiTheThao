// controllers/courts.js
import mongoose from "mongoose";
import Court from "../models/courts.js";
import Tournament from "../models/tournaments.js";

// 1. Lấy danh sách sân (có phân trang, lọc)
export const getCourtsByTournament = async (req, res) => {
    try {
        const { tournamentId } = req.params;
        const { page = 1, limit = 20, sportType, status } = req.query;

        if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
            return res.status(400).json({ success: false, message: "ID giải đấu không hợp lệ" });
        }

        const filter = { tournamentId };
        if (sportType) filter.sportTypes = sportType;
        if (status) filter.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [courts, total] = await Promise.all([
            Court.find(filter).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }),
            Court.countDocuments(filter)
        ]);

        return res.status(200).json({
            success: true,
            data: courts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("getCourtsByTournament error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Thêm sân mới
export const addCourt = async (req, res) => {
    try {
        const { name, tournamentId, sportTypes, location } = req.body;

        if (!name || !tournamentId) {
            return res.status(400).json({ success: false, message: "Thiếu tên sân hoặc tournamentId" });
        }
        if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
            return res.status(400).json({ success: false, message: "tournamentId không hợp lệ" });
        }

        // Kiểm tra giải đấu tồn tại (tuỳ chọn)
        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) {
            return res.status(404).json({ success: false, message: "Giải đấu không tồn tại" });
        }

        let sportTypesArray = [];
        if (Array.isArray(sportTypes)) sportTypesArray = sportTypes;
        else if (typeof sportTypes === 'string') sportTypesArray = [sportTypes];
        else sportTypesArray = ['Pickleball'];

        const existing = await Court.findOne({ name, tournamentId });
        if (existing) {
            return res.status(409).json({ success: false, message: "Tên sân đã tồn tại trong giải đấu này" });
        }

        const newCourt = await Court.create({
            name,
            tournamentId,
            sportTypes: sportTypesArray,
            location: location || '',
            status: 'empty'
        });

        return res.status(201).json({ success: true, message: "Thêm sân thành công", data: newCourt });
    } catch (error) {
        console.error("addCourt error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Cập nhật thông tin sân (tên, sportTypes, location)
export const updateCourt = async (req, res) => {
    try {
        const { courtId } = req.params;
        const { name, sportTypes, location } = req.body;

        if (!mongoose.Types.ObjectId.isValid(courtId)) {
            return res.status(400).json({ success: false, message: "ID sân không hợp lệ" });
        }

        const court = await Court.findById(courtId);
        if (!court) return res.status(404).json({ success: false, message: "Sân không tồn tại" });

        if (name) court.name = name;
        if (sportTypes) {
            let sportTypesArray = Array.isArray(sportTypes) ? sportTypes : [sportTypes];
            court.sportTypes = sportTypesArray;
        }
        if (location !== undefined) court.location = location;

        await court.save();
        return res.status(200).json({ success: true, message: "Cập nhật sân thành công", data: court });
    } catch (error) {
        console.error("updateCourt error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 4. Cập nhật trạng thái sân
export const updateCourtStatus = async (req, res) => {
    try {
        const { courtId } = req.params;
        const { status } = req.body;

        const allowedStatus = ['empty', 'busy', 'maintenance', 'inactive'];
        if (!status || !allowedStatus.includes(status)) {
            return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
        }

        const court = await Court.findById(courtId);
        if (!court) return res.status(404).json({ success: false, message: "Sân không tồn tại" });

        court.status = status;
        await court.save();
        return res.status(200).json({ success: true, message: "Cập nhật trạng thái sân thành công", data: court });
    } catch (error) {
        console.error("updateCourtStatus error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 5. Xóa sân
export const deleteCourt = async (req, res) => {
    try {
        const { courtId } = req.params;

        const court = await Court.findById(courtId);
        if (!court) return res.status(404).json({ success: false, message: "Sân không tồn tại" });


        await Court.findByIdAndDelete(courtId);
        return res.status(200).json({ success: true, message: "Xóa sân thành công" });
    } catch (error) {
        console.error("deleteCourt error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
