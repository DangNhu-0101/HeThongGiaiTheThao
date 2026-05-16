import express from 'express';
import mongoose from 'mongoose';
import Tournament from '../models/tournaments.js';
import Organization from '../models/Organizations.js';
import { createRuleServices } from '../services/createRuleService.js';
import { initializeSportStructure } from '../services/tournamentInstanceService.js';

// 1. LẤY TẤT CẢ GIẢI ĐẤU
export const getAllTournament = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const filter = status ? { status } : {};

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [tournaments, total] = await Promise.all([
            Tournament.find(filter)
                .populate('organizer', 'name logo') // Sửa: 'organizer' viết thường
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Tournament.countDocuments(filter)
        ]);

        const customData = tournaments.map(t => ({
            _id: t._id,
            name: t.name,
            status: t.status,
            organization: t.organizer?.name || "N/A" // Sửa: t.organizer
        }));

        return res.status(200).json({ 
            success: true, 
            total, 
            page: parseInt(page),
            limit: parseInt(limit),
            data: customData 
        });
    } catch (error) {
        console.error("LỖI GET_ALL:", error);
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// 2. TẠO GIẢI ĐẤU MỚI
export const createTournament = async (req, res) => {
    try {
        const { 
            name, slogan, targetParticipants, location, description, 
            prizes, organizer, contactPerson, timeLine, galaConfig, sportsConfig 
        } = req.body;

        // Parse JSON fields
        const parsedContact = typeof contactPerson === 'string' ? JSON.parse(contactPerson) : contactPerson;
        const parsedTimeLine = typeof timeLine === 'string' ? JSON.parse(timeLine) : timeLine;
        const parsedGala = typeof galaConfig === 'string' ? JSON.parse(galaConfig) : galaConfig;
        const parsedSports = typeof sportsConfig === 'string' ? JSON.parse(sportsConfig) : sportsConfig;

        // Xử lý File từ Multer
        const logo = req.files?.logo?.[0]?.path || "";
        const paymentQR = req.files?.paymentQR?.[0]?.path || "";
        const banners = req.files?.banners ? req.files.banners.map(f => f.path) : [];

        const newTournament = await Tournament.create({
            name, 
            slogan, 
            targetParticipants, 
            location, 
            description, 
            prizes,
            organizer, // Field này khớp với Model
            contactPerson: parsedContact,
            timeLine: parsedTimeLine,
            galaConfig: parsedGala,
            sportsConfig: parsedSports,
            sportType: parsedSports.map(s => s.sport),
            logo,
            paymentQR,
            banners,
            status: 'upcoming'
        });

        res.status(201).json({ 
            success: true, 
            data: newTournament 
        });
    } catch (error) {
        console.error("LỖI CREATE:", error);
        res.status(400).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// 3. CHỈNH SỬA GIẢI ĐẤU
export const editTournament = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user.id || req.user._id;

        const tournament = await Tournament.findById(id);
        if (!tournament) {
            return res.status(404).json({ success: false, message: "Không tìm thấy giải đấu" });
        }

        // Cho phép Organization sửa mọi giải (bỏ kiểm tra quyền sở hữu)
        // Nếu muốn giữ kiểm tra:
        // const org = await Organization.findById(tournament.organizer);
        // if (!org || org.ownerId.toString() !== currentUserId.toString()) {
        //     return res.status(403).json({ success: false, message: "Bạn không có quyền sửa giải này" });
        // }

        const updateData = { ...req.body };
        
        // Parse JSON fields nếu là string
        if (typeof updateData.contactPerson === 'string') {
            updateData.contactPerson = JSON.parse(updateData.contactPerson);
        }
        if (typeof updateData.timeLine === 'string') {
            updateData.timeLine = JSON.parse(updateData.timeLine);
        }
        if (typeof updateData.galaConfig === 'string') {
            updateData.galaConfig = JSON.parse(updateData.galaConfig);
        }
        if (typeof updateData.sportsConfig === 'string') {
            updateData.sportsConfig = JSON.parse(updateData.sportsConfig);
            updateData.sportType = updateData.sportsConfig.map(s => s.sport);
        }

        // Xử lý files mới nếu có
        if (req.files?.logo?.[0]) {
            updateData.logo = req.files.logo[0].path;
        }
        if (req.files?.paymentQR?.[0]) {
            updateData.paymentQR = req.files.paymentQR[0].path;
        }
        if (req.files?.banners?.length > 0) {
            updateData.banners = req.files.banners.map(f => f.path);
        }

        // Log để debug
        console.log("Update data:", JSON.stringify(updateData, null, 2));
        console.log("Files:", req.files);

        const updatedTournament = await Tournament.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true, runValidators: true }
        );

        console.log("Updated:", updatedTournament?.name);

        return res.status(200).json({ success: true, data: updatedTournament });
    } catch (error) {
        console.error("LỖI EDIT:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 4. CHI TIẾT GIẢI ĐẤU
export const getTournament = async (req, res) => {
    try {
        const { id } = req.params;
        const tournament = await Tournament.findById(id)
            .populate("organizer", "name logo contactEmail contactPhone") // Sửa: "organizer"
            .populate("baseRule")
            .lean();

        if (!tournament) {
            return res.status(404).json({ 
                success: false, 
                message: "Giải đấu không tồn tại" 
            });
        }

        // Tính toán tài chính
        const finance = {
            totalSponsor: tournament.budget?.totalSponsor || 0,
            totalExpense: tournament.budget?.totalExpense || 0,
            balance: (tournament.budget?.totalSponsor || 0) - (tournament.budget?.totalExpense || 0)
        };

        return res.status(200).json({
            success: true,
            data: { ...tournament, finance }
        });
    } catch (error) {
        console.error("LỖI GET ONE:", error);
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// 5. HỦY GIẢI ĐẤU
export const cancelTournament = async (req, res) => {
    try {
        const { id } = req.params;
        const tournament = await Tournament.findById(id);
        
        if (!tournament) {
            return res.status(404).json({ 
                success: false, 
                message: "Không tìm thấy giải đấu" 
            });
        }
        
        if (['playing', 'completed', 'cancelled'].includes(tournament.status)) {
            return res.status(400).json({ 
                success: false, 
                message: "Trạng thái hiện tại không cho phép hủy" 
            });
        }

        tournament.status = 'cancelled';
        await tournament.save();

        return res.status(200).json({ 
            success: true, 
            message: "Đã hủy giải đấu thành công" 
        });
    } catch (error) {
        console.error("LỖI CANCEL:", error);
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};