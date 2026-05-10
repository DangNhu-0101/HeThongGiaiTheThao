
import Sponsor from "../models/Sponsor.js";
import Tournament from "../models/tournament.js";
import mongoose from "mongoose";

// 1. Lấy danh sách nhà tài trợ theo giải đấu (có phân trang + lọc)
export const getSponsorsByTournament = async (req, res) => {
    try {
        const { tournamentId } = req.params;
        const { page = 1, limit = 10, sponsorType, status } = req.query;

        if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
            return res.status(400).json({ success: false, message: "ID giải đấu không hợp lệ" });
        }

        const filter = { tournamentId };
        if (sponsorType) filter.sponsorType = sponsorType;
        if (status) filter.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [sponsors, total] = await Promise.all([
            Sponsor.find(filter)
                .skip(skip)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 }),
            Sponsor.countDocuments(filter)
        ]);

        return res.status(200).json({
            success: true,
            data: sponsors,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("getSponsorsByTournament error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Lấy chi tiết một nhà tài trợ
export const getSponsorById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "ID không hợp lệ" });
        }
        const sponsor = await Sponsor.findById(id);
        if (!sponsor) {
            return res.status(404).json({ success: false, message: "Không tìm thấy nhà tài trợ" });
        }
        return res.status(200).json({ success: true, data: sponsor });
    } catch (error) {
        console.error("getSponsorById error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Thêm nhà tài trợ mới
export const createSponsor = async (req, res) => {
    try {
        const {
            name,
            logo,
            website,
            tournamentId,
            sponsorType,
            sponsorshipType,
            amount,
            contactPerson,
            status
        } = req.body;

        // Validate bắt buộc
        if (!name || !tournamentId || amount === undefined) {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin bắt buộc: name, tournamentId, amount"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
            return res.status(400).json({ success: false, message: "tournamentId không hợp lệ" });
        }

        // Kiểm tra giải đấu tồn tại
        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) {
            return res.status(404).json({ success: false, message: "Giải đấu không tồn tại" });
        }

        const newSponsor = await Sponsor.create({
            name,
            logo: logo || "",
            website: website || "",
            tournamentId,
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

// 4. Cập nhật nhà tài trợ
export const updateSponsor = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "ID không hợp lệ" });
        }

        const sponsor = await Sponsor.findById(id);
        if (!sponsor) {
            return res.status(404).json({ success: false, message: "Nhà tài trợ không tồn tại" });
        }

        // Các trường được phép cập nhật
        const allowedUpdates = [
            "name", "logo", "website", "sponsorType", "sponsorshipType",
            "amount", "contactPerson", "status"
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

export const deactivateSponsor = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "ID không hợp lệ" });
        }

        const sponsor = await Sponsor.findById(id);
        if (!sponsor) {
            return res.status(404).json({ success: false, message: "Nhà tài trợ không tồn tại" });
        }

        sponsor.status = 'inactive';
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

export const activateSponsor = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "ID không hợp lệ" });
        }

        const sponsor = await Sponsor.findById(id);
        if (!sponsor) {
            return res.status(404).json({ success: false, message: "Nhà tài trợ không tồn tại" });
        }

        sponsor.status = 'active';
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