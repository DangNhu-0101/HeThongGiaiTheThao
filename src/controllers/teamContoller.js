import express from 'express';
import mongoose from 'mongoose';
import Team from '../models/teams.js'; 
import Rule from '../models/Rule/baseRules.js';
import Tournament from '../models/tournament.js';
import PlayerModel from '../models/players.js'; 
import Member from '../models/members.js';
import User from '../models/User.js';
import Invitation from '../models/Invitations.js';
import handleCreateInvitation from '../utils/invitationHelper.js';

// TAO DOi
export const createTeam = async (req, res) => {
    try {
        const { teamName, tournamentName } = req.body;
        const currentId = req.user.id; // Dùng .id cho thống nhất với các hàm khác

        if (!teamName) {
            return res.status(400).json({ message: "Vui lòng nhập tên đội bóng!" });
        }
        if(!tournamentName) {
            return res.status(400).json({ message: "Vui lòng nhập tên giải đấu!" });
        }
        // Kiểm tra xem giải đấu có tồn tại không
        const tournament = await Tournament.findOne({ displayName: tournamentName });
        if (!tournament) {
            return res.status(404).json({ message: "Không tìm thấy giải đấu với tên này!" });
        }
        const user = await User.findById(currentId);
        if (!user) {
            return res.status(401).json({ message: "không tìm thấy người dùng" })
        }

        const existingTeam = await Team.findOne({
            teamName: teamName,
            tournament: tournament._id || null
        });

        if (existingTeam) {
            return res.status(400).json({ message: "Tên đội bóng này đã được đăng ký rồi!" });
        }

        // Tạo đội mới và gán người tạo là chủ đội
        const newTeam = await Team.create({
            teamName,
            tournamentId: tournament._id || null,
            createdBy: currentId,
        });

        await Member.create({
            teamId: newTeam._id,
            userId: currentId,
            role: 'Captain',
            status: 'Active'
        });

        return res.status(201).json({
            message: "Tạo đội bóng thành công",
            data: newTeam
        });

    } catch (error) {
        console.error("Lỗi tạo đội:", error);
        return res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
    }
};

// gui loi moi
export const sendInvitation = async (req, res) => {
    try {
        const { teamId, userReceive } = req.body;
        const senderId = req.user.id;

        // 1. Kiểm tra Team có tồn tại không
        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ message: "Đội bóng không tồn tại!" });

        // 2. PHÂN QUYỀN: Chỉ Captain hoặc người tạo Team mới được mời
        // Check trong bảng Member xem senderId có role là Captain không
        const senderMember = await Member.findOne({ teamId, userId: senderId });

        const isCreator = team.createdBy.toString() === senderId;
        const isCaptain = senderMember?.role === 'Captain';

        if (!isCreator && !isCaptain) {
            return res.status(403).json({
                message: "Chỉ Đội trưởng hoặc Người tạo đội mới có quyền mời thành viên!"
            });
        }

        // 3. Gọi Helper để xử lý logic tạo Invitation và Member ảo (Invited)
        // Helper này ní đã có, tui chỉ thêm bước tạo Member record vào đó
        const newInvitation = await handleCreateInvitation(senderId, userReceive, teamId);

        return res.status(201).json({
            success: true,
            message: "Gửi lời mời thành công!",
            data: newInvitation
        });

    } catch (error) {
        console.error("Lỗi gửi lời mời:", error);
        return res.status(400).json({
            success: false,
            message: error.message || "Lỗi hệ thống khi gửi lời mời"
        });
    }
};

export const acceptInvitation = async (req, res) => {
    const session = await mongoose.startSession(); // Nên dùng session để đảm bảo tính toàn vẹn
    session.startTransaction();

    try {
        const { requestId } = req.params;
        const currentUserId = req.user.id;

        // 1. Kiểm tra lời mời
        const invitation = await Invitation.findById(requestId).session(session);
        if (!invitation || invitation.status !== 'pending') {
            throw new Error("Lời mời không hợp lệ hoặc đã được xử lý.");
        }

        // 2. Bảo mật: Chỉ người được mời mới có quyền accept
        if (invitation.receiverId.toString() !== currentUserId) {
            throw new Error("Bạn không có quyền chấp nhận lời mời này.");
        }

        // 3. Kiểm tra giới hạn thành viên (Roster Limit) từ Rule của giải đấu
        const team = await Team.findById(invitation.teamId).populate({
            path: 'tournamentId',
            populate: { path: 'rules' }
        }).session(session);    

        const correctRule = team.tournamentId.rules.find(
            rule => rule.sportType === team.sportType
        );

        if (correctRule) {
            const maxPlayers = correctRule.rosterConfig?.maxParticipantsPerSide || 99;
            const currentActiveMembers = await Member.countDocuments({
                teamId: invitation.teamId,
                status: 'Active'
            });

            if (currentActiveMembers >= maxPlayers) {
                throw new Error(`Đội đã đạt giới hạn tối đa ${maxPlayers} người cho môn ${team.sportType}`);
            }
        }

        // 4. CẬP NHẬT TRẠNG THÁI
        // Cập nhật Invitation
        invitation.status = 'accepted';
        await invitation.save({ session });

        // Cập nhật Member từ 'Invited' sang 'Active'
        const updatedMember = await Member.findOneAndUpdate(
            { teamId: invitation.teamId, userId: currentUserId },
            { status: 'Active', joinedAt: Date.now() },
            { new: true, session }
        );

        if (!updatedMember) {
            throw new Error("Không tìm thấy hồ sơ thành viên để kích hoạt.");
        }

        await session.commitTransaction();
        return res.status(200).json({ success: true, message: "Gia nhập đội thành công!" });

    } catch (error) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// [PATCH] /api/teams/reject-invitation/:requestId
export const rejectInvitation = async (req, res) => {
    try {
        const { requestId } = req.params;
        const currentUserId = req.user.id;

        const invitation = await Invitation.findById(requestId);
        if (!invitation || invitation.status !== 'pending') {
            return res.status(404).json({ message: "Lời mời không tồn tại." });
        }

        if (invitation.receiverId.toString() !== currentUserId) {
            return res.status(403).json({ message: "Bạn không có quyền từ chối lời mời này." });
        }

        // 1. Cập nhật trạng thái lời mời
        invitation.status = 'rejected';
        await invitation.save();

        // 2. Xóa bản ghi Member 'Invited' để giải phóng bộ nhớ và cho phép mời lại sau này
        await Member.findOneAndDelete({
            teamId: invitation.teamId,
            userId: currentUserId,
            status: 'Invited'
        });

        return res.status(200).json({ success: true, message: "Đã từ chối lời mời." });
    } catch (error) {
        return res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
    }
};

// LAY TAT CA DOI MA NGUOI DUNG DANG THAM GIA
export const getAllTeam = async (req, res) => {
    try {
        const currentUserId = req.user.id;

        // 1. Tìm tất cả bản ghi Member của user này (chỉ lấy những đội đã Active)
        const memberRecords = await Member.find({
            userId: currentUserId,
            status: 'Active'
        })
            .populate({
                path: 'teamId',
                populate: { path: 'tournamentId', select: 'displayName year' } // Lấy luôn thông tin giải đấu
            })
            .sort({ createdAt: -1 });

        // 2. Map lại dữ liệu để trả về danh sách Team sạch sẽ cho Frontend
        const teams = memberRecords.map(record => record.teamId).filter(team => team !== null);

        return res.status(200).json({
            success: true,
            message: "Lấy danh sách đội thành công",
            count: teams.length,
            data: teams
        });
    } catch (error) {
        return res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
    }
};

// LAY THONG TIN CHI TIET MOT DOI BONG
export const getTeamDetail = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Lấy thông tin Team và Giải đấu
        const team = await Team.findById(id).populate('tournamentId', 'displayName year location');
        if (!team) return res.status(404).json({ message: "Không tìm thấy đội bóng." });

        // 2. Lấy danh sách thành viên từ bảng Member (Active và cả Invited nếu là Captain xem)
        const members = await Member.find({ teamId: id })
            .populate('userId', 'displayName avatarUrl email')
            .populate('playerId', 'position skillLevel'); // Nếu ní có model Player

        // 3. Gom dữ liệu lại
        const data = {
            ...team._doc,
            members: members
        };

        return res.status(200).json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
    }
};
//  LẤY DANH SÁCH ĐỘI TRONG 1 GIẢI ĐẤU
export const getTeamsByTournament = async (req, res) => {
    try {
        const { tournamentId } = req.params;

        // Kiểm tra tournament có tồn tại không
        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) {
            return res.status(404).json({ 
                success: false,
                message: "Giải đấu không tồn tại", 
                data: [] 
            });
        }

        // FIX: Tìm teams theo tournamentId, bao gồm cả teams cũ có thể không có field này
        let teams = await Team.find({ 
            $or: [
                { tournamentId: tournamentId },
                { tournamentId: null },
                { tournamentId: { $exists: false } }
            ]
        })
            .populate('createdBy', 'displayName')
            .lean();

        // Bổ sung thêm số lượng thành viên hiện tại cho mỗi đội
        const teamsWithCount = await Promise.all(teams.map(async (team) => {
            const memberCount = await Member.countDocuments({ teamId: team._id, status: 'Active' });
            return { ...team, currentMemberCount: memberCount };
        }));

        return res.status(200).json({
            success: true,
            count: teamsWithCount.length,
            data: teamsWithCount
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false,
            message: "Lỗi hệ thống khi lấy danh sách đội", 
            error: error.message 
        });
    }
};

// LẤY CÁC LỜI MỜI CHO NGƯỜI DÙNG HIỆN TẠI
export const getUserInvitations = async (req, res) => {
    try {
        const currentUserId = req.user.id;

        const invitations = await Invitation.find({
            receiverId: currentUserId,
            status: 'pending'
        })
            .populate({
                path: 'senderId',
                select: 'displayName email'
            })
            .populate({
                path: 'teamId',
                select: 'teamName sportType tournament createdBy'
            })
            .sort({ createdAt: -1 })
            .lean();

        // Chuyển đổi dữ liệu thành format phù hợp cho frontend
        const formattedInvitations = invitations.map(inv => ({
            id: inv._id,
            type: 'INVITATION',
            title: '📩 Lời mời vào đội',
            message: `${inv.senderId.displayName} đã mời bạn tham gia đội "${inv.teamId.teamName}".`,
            teamId: inv.teamId._id,
            teamName: inv.teamId.teamName,
            senderName: inv.senderId.displayName,
            isRead: false,
            date: new Date(inv.createdAt).toLocaleDateString('vi-VN')
        }));

        return res.status(200).json({
            success: true,
            data: formattedInvitations
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi hệ thống khi lấy danh sách lời mời",
            error: error.message
        });
    }
};
export const updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params; // Lấy ID đội bóng từ URL
        const { isPaid } = req.body; // Lấy trạng thái từ Frontend gửi lên

        // Cập nhật trực tiếp vào MongoDB Atlas
        const updatedTeam = await Team.findByIdAndUpdate(
            id,
            { $set: { isPaid: isPaid } },
            { new: true } // Yêu cầu Mongoose trả về data mới nhất sau khi sửa
        );

        if (!updatedTeam) {
            return res.status(404).json({ 
                success: false, 
                message: "Không tìm thấy đội thi đấu." 
            });
        }

        return res.status(200).json({
            success: true,
            message: `Đã cập nhật trạng thái thanh toán thành: ${isPaid ? 'Đã đóng' : 'Chưa đóng'}`,
            data: updatedTeam
        });

    } catch (error) {
        console.error("Lỗi cập nhật thanh toán:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Lỗi hệ thống khi cập nhật thanh toán", 
            error: error.message 

        });
    }
};