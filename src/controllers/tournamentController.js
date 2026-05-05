import express from 'express';
import mongoose from 'mongoose';
import RuleRegister from '../utils/ruleRegister.js';
import Tournament from '../models/tournament.js';
import User from '../models/User.js';
import Organization from '../models/orgnizations.js';
import { createRules } from './ruleController.js';


// LẤY TẤT CẢ GIẢI ĐẤU
export const getAllTournament = async (req, res) => {
    try {
        // 1. Lấy danh sách giải đấu, lôi thông tin rules và cả thông tin tổ chức cho xịn
        const tournaments = await Tournament.find()
            .populate("rules")
            .populate("organizationId", "orgName logoUrl");

        if (!tournaments || tournaments.length === 0) {
            return res.status(200).json({
                success: true,
                message: "Chưa có giải đấu nào trong hệ thống",
                data: []
            });
        }

        // 2. Map lại dữ liệu để tính toán doanh thu tổng cho từng giải
        const customData = tournaments.map(t => {

            // Tính tổng doanh thu dự kiến của TẤT CẢ các môn thi trong giải đó
            const totalPlannedRevenue = (t.rules || []).reduce((sum, rule) => {
                // Tùy vào cấu trúc rule của ní (ví dụ: economics.entryFee hoặc registration.entryFee)
                const fee = rule.economics?.entryFee || rule.registration?.entryFee || 0;
                const max = rule.timeline?.maxTeams || rule.registration?.maxTeams || 0;
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
                // Trả về số lượng môn thi để FE hiện icon
                sportsCount: t.rules?.length || 0,
                // Chỉ trả về sơ lược rules hoặc ID để tránh data quá nặng khi load danh sách
                rules: t.rules
            };
        });

        return res.status(200).json({
            success: true,
            message: "Lấy danh sách các giải đấu thành công",
            count: tournaments.length,
            data: customData
        });

    } catch (error) {
        console.error("Lỗi trong hàm getAllTournament:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi hệ thống khi xử lý danh sách giải đấu",
            error: error.message
        });
    }
}



export const createTournament = async (req, res) => {
    // Khởi tạo session để dùng Transaction (Đảm bảo tất cả thành công hoặc tất cả thất bại)
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { displayName, year, sportConfig, startDate, endDate } = req.body;
        const currentUserId = req.user.id;

        // 1. Kiểm tra Organization
        const org = await Organization.findOne({ userId: currentUserId }).session(session);
        if (!org) {
            await session.abortTransaction();
            return res.status(403).json({ message: "Bạn chưa phải là một tổ chức!" });
        }

        // 2. Kiểm tra trùng lặp
        const checkTournament = await Tournament.findOne({ displayName, year }).session(session);
        if (checkTournament) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Giải đấu này đã tồn tại trong năm nay" });
        }

        // 3. TẠO TOURNAMENT TRƯỚC (Để lấy ID giải đấu)
        const newTournament = await Tournament.create([{
            displayName,
            year,
            startDate, 
            endDate,   
            organizationId: org._id,
            createdBy: currentUserId,
            rules: []
        }], { session });

        const tournamentId = newTournament[0]._id;

        // 4. CHẠY NHÀ MÁY TẠO RULE (Truyền ID giải đấu vào)
        // Sửa hàm createRules của ní để nhận thêm tournamentId
        const createdRules = await createRules(sportConfig, tournamentId, session);
        const ruleIds = createdRules.map(r => r._id);

        // 5. CẬP NHẬT NGƯỢC RULE IDS VÀO TOURNAMENT
        await Tournament.findByIdAndUpdate(tournamentId, {
            $set: { rules: ruleIds }
        }, { session });

        // 6. Cập nhật ngược lại cho Organization
        await Organization.findByIdAndUpdate(org._id, {
            $push: { tournaments: tournamentId }
        }, { session });

        // Hoàn tất Transaction
        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({
            success: true,
            message: `Tạo giải đấu ${displayName} thành công`,
            data: {
                tournamentId: tournamentId,
                ruleCount: ruleIds.length
            }
        });

    } catch (error) {
        // Nếu có bất kỳ lỗi nào, hủy toàn bộ dữ liệu đã tạo trong transaction này
        await session.abortTransaction();
        session.endSession();
        console.error("Lỗi createTournament:", error);
        return res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
    }
};

// LẤY CHI TIẾT MỘT GIẢI ĐẤU

export const getTournament = async (req, res) => {
    try {
        // FIX: Đổi requestID thành id cho khớp với Route /:id
        const { id } = req.params;

        // Populate cả rules và organizationId để lấy thông tin ban tổ chức
        const tournament = await Tournament.findById(id)
            .populate("rules")
            .populate("organizationId", "orgName logoUrl");

        if (!tournament) {
            return res.status(404).json({ success: false, message: "Không tìm thấy giải đấu này" });
        }

        // TÍNH TOÁN DOANH THU DỰ KIẾN TỪ MẢNG RULES
        const plannedEntryFeeRevenue = tournament.rules.reduce((sum, rule) => {
            const fee = rule.economics?.entryFee || 0;
            const max = rule.timeline?.maxTeams || 0;
            return sum + (fee * max);
        }, 0);

        const actualRevenue = (tournament.budget?.totalEntryFee || 0) +
            (tournament.budget?.totalSponsor || 0);

        // Chuẩn bị dữ liệu trả về cho Frontend
        const customData = {
            _id: tournament._id,
            displayName: tournament.displayName,
            year: tournament.year,
            status: tournament.status,
            organization: tournament.organizationId,
            finance: {
                plannedRevenue: plannedEntryFeeRevenue,
                actualRevenue: actualRevenue,
                totalExpense: tournament.budget?.totalExpense || 0,
                balance: actualRevenue - (tournament.budget?.totalExpense || 0)
            },
            rules: tournament.rules,
            budget: tournament.budget
        };

        return res.status(200).json({
            success: true, // FIX: Bổ sung success: true để Frontend nhận diện được
            message: "Lấy chi tiết giải đấu thành công",
            data: customData
        });

    } catch (error) {
        console.error("Lỗi getTournament:", error);
        return res.status(500).json({ success: false, message: "Lỗi hệ thống", error: error.message });
    }
}

// CHỈNH SỬA GIẢI ĐẤU 
export const editTournament = async (req, res) => {
    try {
        const { id } = req.params; 
        const currentUserId = req.user.id; 
        const updateData = req.body;

        const tournament = await Tournament.findById(id)
            .populate('organizationId', '_id userId');

        if (!tournament) {
            return res.status(404).json({ success: false, message: "Không tìm thấy giải đấu!" });
        }

        // BẢO MẬT: Kiểm tra quyền - người tạo HOẶC quản lý tổ chức
        const isCreator = tournament.createdBy.toString() === currentUserId;
        
        // Nếu organizationId không populated, tìm org theo userId
        let isOrgOwner = false;
        if (tournament.organizationId?.userId) {
            isOrgOwner = tournament.organizationId.userId.toString() === currentUserId;
        } else if (tournament.organizationId) {
            // Fallback: tìm organization theo orgId và kiểm tra userId
            const org = await Organization.findById(tournament.organizationId);
            isOrgOwner = org?.userId?.toString() === currentUserId;
        }

        console.log(`[editTournament] currentUserId=${currentUserId}, createdBy=${tournament.createdBy}, orgId=${tournament.organizationId?._id}, orgOwner=${tournament.organizationId?.userId}, isCreator=${isCreator}, isOrgOwner=${isOrgOwner}`);


        // NGĂN CHẶN SỬA KHI GIẢI ĐANG DIỄN RA
        if (tournament.status === 'playing' || tournament.status === 'finished') {
            return res.status(400).json({
                success: false,
                message: "Giải đấu đang diễn ra hoặc đã kết thúc, không thể chỉnh sửa thông tin chính."
            });
        }

        const updatedTournament = await Tournament.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            success: true,
            message: "Cập nhật giải đấu thành công!",
            data: updatedTournament
        });

    } catch (error) {
        console.error("Lỗi editTournament:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi hệ thống khi cập nhật giải đấu",
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

        // BẢO MẬT: Kiểm tra quyền - người tạo HOẶC quản lý tổ chức
        const isCreator = tournament.createdBy.toString() === currentUserId;
        
        // Nếu organizationId không populated, tìm org theo userId
        let isOrgOwner = false;
        if (tournament.organizationId?.userId) {
            isOrgOwner = tournament.organizationId.userId.toString() === currentUserId;
        } else if (tournament.organizationId) {
            // Fallback: tìm organization theo orgId và kiểm tra userId
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