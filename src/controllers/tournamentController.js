import express from 'express';
import mongoose from 'mongoose';
import Tournament from '../models/tournament.js';
import User from '../models/User.js';
import Organization from '../models/orgnizations.js';
import { createRuleServices } from '../services/createRuleServices.js';
import { initializeSportStructure } from '../services/tournamentStructureService.js';

// LẤY TẤT CẢ GIẢI ĐẤU (có phân trang)
export const getAllTournament = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, sport } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (sport) filter['sportsConfig.sport'] = sport;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [tournaments, total] = await Promise.all([
            Tournament.find(filter)
                .populate('organizationId', 'orgName logoUrl')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Tournament.countDocuments(filter)
        ]);

        const customData = tournaments.map(t => ({
            _id: t._id,
            displayName: t.displayName,
            year: t.year,
            status: t.status,
            organization: t.organizationId,
            sportsCount: t.sportsConfig?.length || 0,
            plannedRevenue: (t.sportsConfig || []).reduce((sum, s) => sum + (s.feeEntry * (s.maxTeams || 0)), 0)
        }));

        return res.status(200).json({
            success: true,
            message: "Lấy danh sách giải đấu thành công",
            count: tournaments.length,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit),
            data: customData
        });
    } catch (error) {
        console.error("getAllTournament error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// TẠO GIẢI ĐẤU MỚI (chỉ tạo tournament, chưa tạo rule)
export const createTournament = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const {
            displayName, timeOpen, timeClose, timeRegister, timeCloseRegister,
            venue, slogan, targetAudience, description, prizes, sportsConfig, galaConfig
        } = req.body;

        const currentUserId = req.user.id || req.user._id;
        const org = await Organization.findOne({ userId: currentUserId }).session(session);
        if (!org) {
            return res.status(403).json({ success: false, message: "Bạn không thuộc tổ chức nào, không thể tạo giải đấu" });
        }

        const parsedSportsConfig = typeof sportsConfig === 'string' ? JSON.parse(sportsConfig) : sportsConfig;
        if (!parsedSportsConfig || parsedSportsConfig.length === 0) {
            return res.status(400).json({ success: false, message: "Cần cung cấp ít nhất một môn thể thao trong cấu hình giải đấu." });
        }

        // Kiểm tra ruleData có đủ không
        for (const sportItem of parsedSportsConfig) {
            if (!sportItem.ruleData) {
                return res.status(400).json({ success: false, message: `Thiếu cấu hình rule cho môn ${sportItem.sport}` });
            }
        }

        const year = timeOpen ? new Date(timeOpen).getFullYear() : new Date().getFullYear();
        const existing = await Tournament.findOne({ displayName, year }).session(session);
        if (existing) {
            return res.status(400).json({ success: false, message: `Giải đấu '${displayName}' đã tồn tại trong năm ${year}` });
        }

        // 1. Tạo tournament
        const [newTournament] = await Tournament.create([{
            displayName, slogan, targetAudience, description, prizes, venue, year,
            banner: req.files?.banner?.[0]?.path || "",
            logo: req.files?.logo?.[0]?.path || "",
            paymentQR: req.files?.paymentQR?.[0]?.path || "",
            status: 'upcoming',
            sportsConfig: parsedSportsConfig,
            galaConfig: typeof galaConfig === 'string' ? JSON.parse(galaConfig) : galaConfig,
            timeLine: {
                timeRegister: timeRegister ? new Date(timeRegister) : null,
                timeCloseRegister: timeCloseRegister ? new Date(timeCloseRegister) : null,
                timeOpen: timeOpen ? new Date(timeOpen) : new Date(),
                timeClose: timeClose ? new Date(timeClose) : null,
            },
            organizationId: org._id,
            createdBy: currentUserId,
            rules: []
        }], { session });

        // 2. Với mỗi môn, tạo rule và cấu trúc thi đấu
        for (let i = 0; i < parsedSportsConfig.length; i++) {
            const sportItem = parsedSportsConfig[i];
            // Tạo rule (baseRule, stageRule, scoring, game, ...)
            const { baseRule } = await createRuleServices(sportItem.ruleData, newTournament._id, session);
            // Lưu baseRuleId vào sportsConfig
            sportItem.baseRuleId = baseRule._id;
            // Khởi tạo bracket, group, team, match
            await initializeSportStructure(newTournament._id, baseRule._id, sportItem, session);
        }

        // Cập nhật lại sportsConfig đã có baseRuleId
        newTournament.sportsConfig = parsedSportsConfig;
        await newTournament.save({ session });

        await Organization.findByIdAndUpdate(org._id, { $push: { tournaments: newTournament._id } }, { session });
        await session.commitTransaction();

        return res.status(201).json({
            success: true,
            message: `Tạo giải đấu ${displayName} thành công!`,
            data: { tournamentId: newTournament._id }
        });
    } catch (error) {
        await session.abortTransaction();
        console.error("Create tournament error:", error);
        return res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// CHỈNH SỬA GIẢI ĐẤU
export const editTournament = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user.id || req.user._id;

        const tournament = await Tournament.findById(id);
        if (!tournament) return res.status(404).json({ success: false, message: "Không tìm thấy giải đấu!" });

        // Kiểm tra quyền: chỉ org hoặc người tạo
        const org = await Organization.findById(tournament.organizationId);
        const isAuthorized = tournament.createdBy.toString() === currentUserId || (org && org.userId.toString() === currentUserId);
        if (!isAuthorized) {
            return res.status(403).json({ success: false, message: "Bạn không có quyền chỉnh sửa giải đấu này" });
        }

        // Cập nhật các trường
        if (req.body.displayName) tournament.displayName = req.body.displayName;
        if (req.body.slogan) tournament.slogan = req.body.slogan;
        if (req.body.targetAudience) tournament.targetAudience = req.body.targetAudience;
        if (req.body.description) tournament.description = req.body.description;
        if (req.body.prizes) tournament.prizes = req.body.prizes;
        if (req.body.venue) tournament.venue = req.body.venue;
        if (req.body.sportsConfig) tournament.sportsConfig = JSON.parse(req.body.sportsConfig);
        if (req.body.galaConfig) tournament.galaConfig = JSON.parse(req.body.galaConfig);

        if (req.body.timeRegister) tournament.timeLine.timeRegister = new Date(req.body.timeRegister);
        if (req.body.timeCloseRegister) tournament.timeLine.timeCloseRegister = new Date(req.body.timeCloseRegister);
        if (req.body.timeOpen) {
            tournament.timeLine.timeOpen = new Date(req.body.timeOpen);
            tournament.year = new Date(req.body.timeOpen).getFullYear();
        }
        if (req.body.timeClose) tournament.timeLine.timeClose = new Date(req.body.timeClose);

        if (req.files?.banner) tournament.banner = req.files.banner[0].path;
        if (req.files?.logo) tournament.logo = req.files.logo[0].path;
        if (req.files?.paymentQR) tournament.paymentQR = req.files.paymentQR[0].path;

        await tournament.save();

        return res.status(200).json({
            success: true,
            message: "Cập nhật giải đấu thành công!",
            data: tournament
        });
    } catch (error) {
        console.error("editTournament error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// LẤY CHI TIẾT GIẢI ĐẤU
export const getTournament = async (req, res) => {
    try {
        const { id } = req.params;
        const tournament = await Tournament.findById(id)
            .populate("organizationId", "orgName logoUrl")
            .lean();

        if (!tournament) {
            return res.status(404).json({ success: false, message: "Không tìm thấy giải đấu" });
        }

        const safeSportsConfig = Array.isArray(tournament.sportsConfig) ? tournament.sportsConfig : [];
        const plannedRevenue = safeSportsConfig.reduce((sum, s) => sum + (s.feeEntry * (s.maxTeams || 0)), 0);
        const actualRevenue = (tournament.budget?.totalEntryFee || 0) + (tournament.budget?.totalSponsor || 0);

        const customData = {
            _id: tournament._id,
            displayName: tournament.displayName,
            slogan: tournament.slogan || "",
            targetAudience: tournament.targetAudience || "",
            description: tournament.description || "",
            venue: tournament.venue,
            year: tournament.year,
            status: tournament.status,
            logo: tournament.logo,
            banner: tournament.banner,
            paymentQR: tournament.paymentQR,
            prizes: tournament.prizes || "",
            timeLine: tournament.timeLine || {},
            sportsConfig: safeSportsConfig,
            galaConfig: tournament.galaConfig || {},
            organization: tournament.organizationId,
            finance: {
                plannedRevenue,
                actualRevenue,
                totalExpense: tournament.budget?.totalExpense || 0,
                balance: actualRevenue - (tournament.budget?.totalExpense || 0)
            },
            budget: tournament.budget || {},
            rules: tournament.rules || []
        };

        return res.status(200).json({
            success: true,
            message: "Lấy chi tiết giải đấu thành công",
            data: customData
        });
    } catch (error) {
        console.error("getTournament error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// HỦY GIẢI ĐẤU
export const cancelTournament = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user?.id;

        const tournament = await Tournament.findById(id).populate('organizationId');
        if (!tournament) {
            return res.status(404).json({ success: false, message: "Không tìm thấy giải đấu" });
        }

        if (tournament.status === 'completed' || tournament.status === 'cancelled'  || tournament.status === 'playing') {
            return res.status(400).json({ success: false, message: "Giải đấu đã kết thúc, không thể hủy" });
        }

        const isCreator = tournament.createdBy?.toString() === currentUserId;
        const isOrgOwner = tournament.organizationId?.userId?.toString() === currentUserId;

        if (!isCreator && !isOrgOwner) {
            return res.status(403).json({ success: false, message: "Bạn không có quyền hủy giải đấu này" });
        }

        tournament.status = 'cancelled';
        await tournament.save();

        return res.status(200).json({
            success: true,
            message: `Giải đấu ${tournament.displayName} đã bị hủy.`,
            data: { _id: tournament._id, status: tournament.status }
        });
    } catch (error) {
        console.error("cancelTournament error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};