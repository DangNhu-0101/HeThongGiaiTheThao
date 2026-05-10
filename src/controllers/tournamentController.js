import express from 'express';
import mongoose from 'mongoose';
import Tournament from '../models/tournament.js';
import User from '../models/User.js';
import Organization from '../models/orgnizations.js';
import { createRuleServices } from '../services/createRuleServices.js';

// LẤY TẤT CẢ GIẢI ĐẤU
export const getAllTournament = async (req, res) => {
    try {
        const tournaments = await Tournament.find()
            // Tạm thời bỏ .populate("rules") để tránh lỗi với các data rác cũ trong DB
            .populate("organizationId", "orgName logoUrl");

        if (!tournaments || tournaments.length === 0) {
            return res.status(200).json({
                success: true,
                message: "Chưa có giải đấu nào trong hệ thống",
                data: []
            });
        }

        const customData = tournaments.map(t => {
            // ĐÃ FIX: Tính toán doanh thu từ mảng sportsConfig xịn sò mới tạo
            const totalPlannedRevenue = (t.sportsConfig || []).reduce((sum, sport) => {
                const fee = sport.feeEntry || 0;
                // Nếu maxTeams bị null (không giới hạn), tạm tính là 0 để không bị lỗi NaN
                const max = sport.maxTeams || 0; 
                return sum + (fee * max);
            }, 0);

            const actualRevenue = (t.budget?.totalEntryFee || 0) + (t.budget?.totalSponsor || 0);

            return {
                _id: t._id,
                displayName: t.displayName,
                year: t.year,
                status: t.status,
                organization: t.organizationId,
                finance: {
                    plannedEntryFeeRevenue: totalPlannedRevenue,
                    actualRevenue: actualRevenue,
                    totalExpense: t.budget?.totalExpense || 0
                },
                // ĐÃ FIX: Lấy số lượng môn từ sportsConfig
                sportsCount: t.sportsConfig?.length || 0 
            };
        });

        return res.status(200).json({
            success: true,
            message: "Lấy danh sách các giải đấu thành công",
            count: tournaments.length,
            data: customData
        });

    } catch (error) {
        console.error("🔥 Lỗi trong hàm getAllTournament:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi hệ thống khi xử lý danh sách giải đấu",
            error: error.message
        });
    }
}
export const createTournament = async (req, res) => {
    try {
        // ĐÃ SỬA: Hứng đúng tên biến từ Frontend gửi lên
        const {
            displayName, timeOpen, timeClose, timeRegister, timeCloseRegister, 
            venue, slogan, targetAudience, description, prizes
        } = req.body;

        const currentUserId = req.user.id || req.user._id;

        const org = await Organization.findOne({ userId: currentUserId });
        if (!org) {
            throw new Error("Bạn chưa có quyền tổ chức giải đấu. Vui lòng cập nhật hồ sơ Tổ chức!");
        }

        // Bắt lỗi Parse JSON nếu có
        let sportsConfigParsed = [];
        let galaConfigParsed = {};
        try {
            if (req.body.sportsConfig) sportsConfigParsed = JSON.parse(req.body.sportsConfig);
            if (req.body.galaConfig) galaConfigParsed = JSON.parse(req.body.galaConfig);
        } catch (e) {
            throw new Error("Dữ liệu cấu hình môn thi hoặc Gala bị lỗi định dạng!");
        }

        const year = timeOpen ? new Date(timeOpen).getFullYear() : new Date().getFullYear();

        const existingTournament = await Tournament.findOne({ displayName, year });
        if (existingTournament) {
            throw new Error(`Giải đấu '${displayName}' đã tồn tại trong năm ${year}`);
        }

        const newTournament = await Tournament.create({
            displayName,
            slogan,
            targetAudience,
            description,
            prizes,
            venue, // Bắt buộc phải có theo Schema
            year,
            banner: req.files?.banner ? req.files.banner[0].path : "",
            logo: req.files?.logo ? req.files.logo[0].path : "",
            paymentQR: req.files?.paymentQR ? req.files.paymentQR[0].path : "",
            status: 'upcoming',
            sportsConfig: sportsConfigParsed,
            galaConfig: galaConfigParsed,
            timeLine: {
                timeRegiter: timeRegister ? new Date(timeRegister) : null,
                timeCloseRegister: timeCloseRegister ? new Date(timeCloseRegister) : null,
                timeOpen: timeOpen ? new Date(timeOpen) : Date.now(),
                timeClose: timeClose ? new Date(timeClose) : null,
            },
            organizationId: org._id,
            createdBy: currentUserId,
            rules: [] 
        });

        await Organization.findByIdAndUpdate(org._id, {
            $push: { tournaments: newTournament._id }
        });

        return res.status(201).json({
            success: true,
            message: `Khởi tạo giải đấu ${displayName} thành công!`,
            data: { tournamentId: newTournament._id }
        });

    } catch (error) {
        console.error("🔥 Lỗi tại createTournament API:", error.message);
        return res.status(400).json({
            success: false,
            message: error.message || "Tạo giải đấu thất bại"
        });
    }
};
// ĐÃ SỬA: Tương tự cho hàm Edit
export const editTournament = async (req, res) => {
    try {
        const { id } = req.params; 
        const currentUserId = req.user.id || req.user._id; 
        
        const tournament = await Tournament.findById(id).populate('organizationId');
        if (!tournament) return res.status(404).json({ success: false, message: "Không tìm thấy giải đấu!" });

      
        // Parse JSON
        if (req.body.sportsConfig) tournament.sportsConfig = JSON.parse(req.body.sportsConfig);
        if (req.body.galaConfig) tournament.galaConfig = JSON.parse(req.body.galaConfig);

        // Cập nhật Text
        const fieldsToUpdate = ['displayName', 'slogan', 'targetAudience', 'venue', 'description', 'prizes'];
        fieldsToUpdate.forEach(field => {
            if (req.body[field] !== undefined) tournament[field] = req.body[field];
        });

        // Cập nhật Thời gian
        if (req.body.timeRegister) tournament.timeLine.timeRegiter = new Date(req.body.timeRegister);
        if (req.body.timeCloseRegister) tournament.timeLine.timeCloseRegister = new Date(req.body.timeCloseRegister);
        if (req.body.timeOpen) {
            tournament.timeLine.timeOpen = new Date(req.body.timeOpen);
            tournament.year = new Date(req.body.timeOpen).getFullYear();
        }
        if (req.body.timeClose) tournament.timeLine.timeClose = new Date(req.body.timeClose);

        // Cập nhật Ảnh nếu có upload file mới
        if (req.files?.banner) tournament.banner = req.files.banner[0].path;
        if (req.files?.logo) tournament.logo = req.files.logo[0].path;
        if (req.files?.paymentQR) tournament.paymentQR = req.files.paymentQR[0].path;

        const updatedTournament = await tournament.save();

        return res.status(200).json({
            success: true,
            message: "Cập nhật giải đấu thành công!",
            data: updatedTournament
        });

    } catch (error) {
        console.error("Lỗi editTournament:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// LẤY CHI TIẾT MỘT GIẢI ĐẤU
export const getTournament = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Đang truy xuất thông tin giải đấu ID: ${id}`);

        const tournament = await Tournament.findById(id)
            .populate("organizationId", "orgName logoUrl")
            .lean(); // Dùng .lean() để xử lý dữ liệu thô, tránh lỗi ràng buộc Mongoose

        if (!tournament) {
            return res.status(404).json({ 
                success: false, 
                message: "Không tìm thấy giải đấu này" 
            });
        }

        // ĐẢM BẢO PHÒNG THỦ: Tránh lỗi undefined nếu sportsConfig trống
        const safeSportsConfig = Array.isArray(tournament.sportsConfig) ? tournament.sportsConfig : [];

        // ĐÃ SỬA: Tính toán doanh thu dự kiến từ mảng sportsConfig mới thay vì rules cũ
        const plannedEntryFeeRevenue = safeSportsConfig.reduce((sum, sport) => {
            const fee = Number(sport?.feeEntry) || 0;
            const max = Number(sport?.maxTeams) || 0;
            return sum + (fee * max);
        }, 0);

        const actualRevenue = (tournament.budget?.totalEntryFee || 0) +
            (tournament.budget?.totalSponsor || 0);

        // ĐA SỬA: Đóng gói đầy đủ các trường mới để DashboardView và TournamentRulesView không bị "Chưa cập nhật"
        const customData = {
            _id: tournament._id,
            displayName: tournament.displayName || "Giải đấu không tên",
            slogan: tournament.slogan || "",
            targetAudience: tournament.targetAudience || "",
            description: tournament.description || "",
            venue: tournament.venue || "Chưa cập nhật địa điểm",
            year: tournament.year || new Date().getFullYear(),
            status: tournament.status || "upcoming",
            logo: tournament.logo || "",
            banner: tournament.banner || "",
            paymentQR: tournament.paymentQR || "",
            prizes: tournament.prizes || "",
            timeLine: {
                timeRegiter: tournament.timeLine?.timeRegiter || null,
                timeCloseRegister: tournament.timeLine?.timeCloseRegister || null,
                timeOpen: tournament.timeLine?.timeOpen || null,
                timeClose: tournament.timeLine?.timeClose || null
            },
            sportsConfig: safeSportsConfig,
            galaConfig: {
                hasGala: tournament.galaConfig?.hasGala || false,
                time: tournament.galaConfig?.time || null,
                venue: tournament.galaConfig?.venue || "",
                description: tournament.galaConfig?.description || ""
            },
            organization: tournament.organizationId || null,
            finance: {
                plannedRevenue: plannedEntryFeeRevenue,
                actualRevenue: actualRevenue,
                totalExpense: tournament.budget?.totalExpense || 0,
                balance: actualRevenue - (tournament.budget?.totalExpense || 0)
            },
            budget: tournament.budget || { totalSponsor: 0, totalExpense: 0 }
        };

        return res.status(200).json({
            success: true, 
            message: "Lấy chi tiết giải đấu thành công",
            data: customData
        });

    } catch (error) {
        console.error("🔥 Lỗi chi tiết tại getTournament:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Lỗi hệ thống khi tải thông tin giải đấu", 
            error: error.message 
        });
    }
};



// XÓA GIẢI ĐẤU
export const cancelTournament = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user?.id;

        const tournament = await Tournament.findById(id)
            .populate('organizationId', '_id userId');

        if (!tournament) {
            return res.status(404).json({ success: false, message: "Không tìm thấy giải đấu" });
        }

        const isCreator = tournament.createdBy.toString() === currentUserId;
        
        let isOrgOwner = false;
        if (tournament.organizationId?.userId) {
            isOrgOwner = tournament.organizationId.userId.toString() === currentUserId;
        } else if (tournament.organizationId) {
            const org = await Organization.findById(tournament.organizationId);
            isOrgOwner = org?.userId?.toString() === currentUserId;
        }

        if (!isCreator && !isOrgOwner) {
            return res.status(403).json({ success: false, message: "Bạn không có quyền thực hiện thao tác này" });
        }

        tournament.status = 'cancelled';
        await tournament.save();

        return res.status(200).json({
            success: true,
            message: `Giải đấu ${tournament.displayName} đã được chuyển sang trạng thái Hủy.`,
            data: tournament
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: "Lỗi hệ thống", error: error.message });
    }
};

