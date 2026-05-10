import express from 'express';
import mongoose from 'mongoose';
import Team from '../models/teams.js'; 
import Rule from '../models/Rule/baseRules.js';
import Tournament from '../models/tournament.js';
import PlayerModel from '../models/players.js'; 
import Member from '../models/members.js';
import User from '../models/User.js';
import Invitation from '../models/Invitations.js';
import Notification from '../models/Notification.js';
import handleCreateInvitation from '../utils/invitationHelper.js';

const handleRandomMatching = async (currentUserId, tournamentId, ruleId, mySkill, session) => {
    const mySkillNum = parseFloat(mySkill);

    // Xây dựng vùng Skill an toàn (Chênh lệch tối đa 1.5)
    // Điều này tự động thỏa mãn: Top-Mid (OK), Mid-Low (OK), Top-Low (Cấm)
    // Vì: Top(4.0) - Low(2.0) = 2.0 > 1.5 => Bị loại
    const minSkill = mySkillNum - 1.5;
    const maxSkill = mySkillNum + 1.5;

    // Tìm những đội đang "khuyết" thành viên trong giải đấu này
    const matchingTeam = await Member.aggregate([
        { 
            $match: { role: 'Captain', status: 'Active' } 
        },
        {
            $lookup: {
                from: 'players',
                localField: 'userId',
                foreignField: 'userId',
                as: 'captainProfile'
            }
        },
        { $unwind: '$captainProfile' },
        { 
            $match: { 
                'captainProfile.skill': { $gte: minSkill.toString(), $lte: maxSkill.toString() } 
            } 
        },
        {
            $lookup: {
                from: 'teams',
                localField: 'teamId',
                foreignField: '_id',
                as: 'teamInfo'
            }
        },
        { $unwind: '$teamInfo' },
        {
            $match: { 
                'teamInfo.tournamentId': new mongoose.Types.ObjectId(tournamentId),
                'teamInfo.ruleId': new mongoose.Types.ObjectId(ruleId),
                'teamInfo.isRandomPool': true // Chỉ ghép vào những đội cho phép random
            }
        },
        {
            $lookup: {
                from: 'members',
                localField: 'teamId',
                foreignField: 'teamId',
                as: 'allMembers'
            }
        },
        {
            // Chỉ lấy đội chưa đủ người
            $addFields: { memberCount: { $size: '$allMembers' } }
        },
        {
            $sort: { createdAt: 1 } // Ưu tiên đội chờ lâu nhất
        },
        { $limit: 1 }
    ]);

    if (matchingTeam.length > 0) {
        const teamId = matchingTeam[0].teamId;
        
        // GIA NHẬP ĐỘI CÓ SẴN
        await Member.create([{
            teamId: teamId,
            userId: currentUserId,
            role: 'Member',
            status: 'Active'
        }], { session });

        return { teamId, isNew: false };
    } else {
        // TẠO ĐỘI CHỜ MỚI
        const newRandomTeam = await Team.create([{
            teamName: `Group_${mySkillNum}_${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
            tournamentId,
            ruleId,
            createdBy: currentUserId,
            isRandomPool: true // Đánh dấu đội này mở cửa cho ghép ngẫu nhiên
        }], { session });

        await Member.create([{
            teamId: newRandomTeam[0]._id,
            userId: currentUserId,
            role: 'Captain',
            status: 'Active'
        }], { session });

        return { teamId: newRandomTeam[0]._id, isNew: true };
    }
};

// ==========================================
// QUY TRÌNH ĐĂNG KÝ (REGISTER FLOW) - BẢN FULL
// ==========================================
export const registerFlow = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. KIỂM TRA USER ĐĂNG NHẬP
        if (!req.user) {
            throw new Error("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại!");
        }

        const currentUserId = req.user._id || req.user.id;
        const { tournamentId, sport, categoryId, regMode, teamName, invitedUserIds } = req.body;

        // 2. KIỂM TRA GIẢI ĐẤU
        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) throw new Error("Giải đấu không tồn tại!");
        
        if (tournament.status.toLowerCase() !== 'upcoming') {
             throw new Error("Giải đấu đã đóng cổng đăng ký!");
        }

        const sportConfig = tournament.sportsConfig.find(s => s.sport === sport);
        if (!sportConfig) throw new Error("Môn thi đấu này không có trong giải!");

        // 3. XỬ LÝ TÊN ĐỘI
        let finalTeamName = teamName || `Đội của ${req.user.displayName}`;
        const userName = req.user.displayName || "Vận động viên";

        if (categoryId.includes('S')) {
            finalTeamName = `Solo - ${userName}`;
        }

        // 4. TẠO ĐỘI (TEAM)
        const newTeam = await Team.create([{
            teamName: finalTeamName,
            tournamentId,
            sport,
            categoryId,
            createdBy: currentUserId,
            status: 'pending_payment',
            isPaid: false
        }], { session });

        const teamId = newTeam[0]._id;

        // 5. TẠO ĐỘI TRƯỞNG (CAPTAIN)
        await Member.create([{
            teamId,
            userId: currentUserId,
            role: 'Captain',
            status: 'Active'
        }], { session });

        // 6. XỬ LÝ LỜI MỜI CHO ĐỒNG ĐỘI (Nếu có)
        if (regMode === 'create' && invitedUserIds && invitedUserIds.length > 0) {
            for (const invitedId of invitedUserIds) {
                // Tạo bản ghi Member trạng thái 'Invited'
                await Member.create([{
                    teamId: teamId,
                    userId: invitedId,
                    role: 'Member',
                    status: 'Invited'
                }], { session });

                // Gửi thông báo mời cho đồng đội
                await Notification.create([{
                    userId: invitedId,
                    type: 'INVITATION',
                    title: '📩 Lời mời vào đội mới',
                    message: `${req.user.displayName} đã mời bạn vào đội "${finalTeamName}" môn ${sport}`,
                    metadata: {
                        teamId: teamId,
                        invitedBy: currentUserId
                    }
                }], { session });
            }
        }

        // 7. 🔥 ĐÂY LÀ ĐOẠN NHƯ CẦN: THÔNG BÁO CHO CHÍNH CHỦ ĐỘI
        await Notification.create([{
            userId: currentUserId,
            type: 'SYSTEM',
            title: '✅ Đăng ký giải đấu thành công',
            message: `Bạn đã đăng ký đội "${finalTeamName}" thành công. Hãy hoàn tất lệ phí để được phê duyệt.`,
            metadata: { 
                teamId: teamId,
                amount: regMode === 'random' ? (sportConfig.feeEntry / 2) : sportConfig.feeEntry,
                paymentQR: tournament.paymentQR || "" 
            }
        }], { session });

        // 8. HOÀN TẤT GIAO DỊCH
        await session.commitTransaction();
        console.log("✅ Đăng ký và thông báo thành công!");

        return res.status(201).json({ 
            success: true, 
            message: "Đăng ký thành công!", 
            teamId: teamId 
        });

    } catch (error) {
        // Nếu có bất kỳ lỗi nào, hủy bỏ toàn bộ dữ liệu đã định lưu
        if (session.inTransaction()) await session.abortTransaction();
        console.error("🔥 Lỗi Register Flow:", error.message);
        return res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};
// 3. IMPORT CẦU THỦ 

export const importPlayersToTeam = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { teamId, playersList } = req.body;
        const currentUserId = req.user.id;

        const team = await Team.findById(teamId);
        if (!team) throw new Error("Không tìm thấy đội bóng!");
        
        if (team.createdBy.toString() !== currentUserId) {
            return res.status(403).json({ message: "Bạn không có quyền thêm thành viên cho đội này!" });
        }

        const results = { added: [], failed: [] };

        for (const p of playersList) {
            try {
                let user = await User.findOne({ email: p.email.toLowerCase() });
                if (!user) {
                    results.failed.push({ email: p.email, reason: "Tài khoản chưa đăng ký hệ thống" });
                    continue;
                }

                const isMember = await Member.findOne({ teamId, userId: user._id });
                if (isMember) {
                    results.failed.push({ email: p.email, reason: "Đã có trong đội" });
                    continue;
                }

                await Member.create([{
                    teamId,
                    userId: user._id,
                    role: 'Member',
                    status: 'Active'
                }], { session });

                results.added.push(p.email);
            } catch (err) {
                results.failed.push({ email: p.email, reason: "Lỗi hệ thống" });
            }
        }

        await session.commitTransaction();
        res.status(200).json({ success: true, message: `Đã thêm thành công ${results.added.length} thành viên`, results });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: error.message });
    } finally {
        session.endSession();
    }
};



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
// Trong controllers/teamController.js

export const sendInvitation = async (req, res) => {
    try {
        const { teamId, userReceive } = req.body;
        const senderId = req.user._id || req.user.id;

        const team = await Team.findById(teamId);
        const receiver = await User.findById(userReceive);

        // 1. Tạo Member record (giữ chỗ)
        await Member.create({ teamId, userId: userReceive, status: 'Invited' });

        // 2. THÔNG BÁO CHO NGƯỜI NHẬN (Để họ Chấp nhận/Từ chối)
        await Notification.create({
            userId: userReceive,
            type: 'INVITATION',
            title: '📩 Lời mời gia nhập đội',
            message: `Bạn có lời mời gia nhập đội "${team.teamName}" từ ${req.user.displayName}.`,
            metadata: { teamId, invitedBy: senderId }
        });

        // 3. THÔNG BÁO CHO NGƯỜI GỬI (Để xác nhận đã gửi thành công)
        await Notification.create({
            userId: senderId,
            type: 'SYSTEM',
            title: '📤 Đã gửi lời mời',
            message: `Bạn đã gửi lời mời đến ${receiver.displayName}. Khi họ phản hồi, chúng tôi sẽ thông báo cho bạn ngay.`,
            metadata: { teamId } // Link để họ bấm về trang quản lý đội
        });

        return res.status(201).json({ success: true, message: "Đã gửi lời mời cho cả 2 bên!" });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
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
// LẤY TẤT CẢ ĐỘI (BẢN PHÒNG THỦ CAO)
export const getAllTeam = async (req, res) => {
    try {
        const teams = await Team.find()
            .populate('tournamentId', 'displayName year')
            .populate('createdBy', 'displayName')
            .lean();

        // Nếu không có đội nào, trả về mảng rỗng thay vì để lỗi sập
        if (!teams) return res.status(200).json({ success: true, data: [] });

        // Map dữ liệu an toàn để tránh lỗi undefined khi render ở Home.jsx
        const safeData = teams.map(t => ({
            ...t,
            teamName: t.teamName || "Đội chưa đặt tên",
            sport: t.sport || "Chưa xác định",
            categoryId: t.categoryId || "N/A",
            tournamentName: t.tournamentId?.displayName || "Giải đấu tự do"
        }));

        return res.status(200).json({
            success: true,
            data: safeData
        });
    } catch (error) {
        console.error("🔥 Lỗi getAllTeam:", error);
        return res.status(500).json({ success: false, message: "Lỗi lấy danh sách đội" });
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

// 1. LẤY DANH SÁCH LỜI MỜI ĐÃ GỬI (Dành cho người đi mời)
export const getSentInvitations = async (req, res) => {
    try {
        const currentUserId = req.user._id || req.user.id;

        // Tìm tất cả các Team do User này tạo ra
        const myTeams = await Team.find({ createdBy: currentUserId }).select('_id');
        const myTeamIds = myTeams.map(t => t._id);

        // Lấy danh sách Member có status 'Invited' thuộc các Team trên
        const invites = await Member.find({
            teamId: { $in: myTeamIds },
            status: 'Invited'
        })
        .populate('userId', 'displayName phoneNumber email')
        .populate('teamId', 'teamName sport categoryId')
        .lean();

        return res.status(200).json({
            success: true,
            data: invites
        });
    } catch (error) {
        console.error("Lỗi lấy lời mời đã gửi:", error);
        return res.status(500).json({ success: false, message: "Không thể tải danh sách lời mời" });
    }
};
// 2. HỦY LỜI MỜI (THU HỒI)
export const cancelInvitation = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { memberRecordId } = req.params; // ID của bản ghi trong bảng Member
        const senderId = req.user._id || req.user.id;

        const memberInvite = await Member.findById(memberRecordId).populate('teamId');
        
        if (!memberInvite) throw new Error("Lời mời không tồn tại hoặc đã bị hủy.");

        // Bảo mật: Chỉ chủ đội mới có quyền thu hồi lời mời
        if (memberInvite.teamId.createdBy.toString() !== senderId.toString()) {
            throw new Error("Bạn không có quyền thu hồi lời mời này!");
        }

        if (memberInvite.status !== 'Invited') {
            throw new Error("Người này đã tham gia đội, không thể thu hồi lời mời.");
        }

        // Xóa bản ghi Member
        await Member.findByIdAndDelete(memberRecordId).session(session);

        // Xóa Notification tương ứng (để người kia không thấy lời mời nữa)
        await Notification.findOneAndDelete({
            userId: memberInvite.userId,
            'metadata.teamId': memberInvite.teamId._id,
            type: 'INVITATION'
        }).session(session);

        await session.commitTransaction();
        return res.status(200).json({ success: true, message: "Đã thu hồi lời mời thành công." });

    } catch (error) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

export const respondInvitation = async (req, res) => {
    const { notificationId, teamId, action } = req.body; // action: 'accept' hoặc 'reject'
    const currentUserId = req.user._id || req.user.id;

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const team = await Team.findById(teamId);
        if (!team) throw new Error("Đội bóng không còn tồn tại.");

        if (action === 'accept') {
            // Chuyển status từ Invited sang Active
            await Member.findOneAndUpdate(
                { teamId, userId: currentUserId, status: 'Invited' },
                { status: 'Active' },
                { session }
            );

            // Thông báo cho Đội trưởng biết có người vừa vào
            await Notification.create([{
                userId: team.createdBy,
                type: 'SYSTEM',
                title: '🎉 Có thành viên mới!',
                message: `${req.user.displayName} đã chấp nhận lời mời vào đội "${team.teamName}".`,
                metadata: { teamId }
            }], { session });
        } else {
            // Nếu từ chối, xóa luôn bản ghi Member Invited
            await Member.findOneAndDelete({ teamId, userId: currentUserId, status: 'Invited' }, { session });
        }

        // Đánh dấu thông báo mời là đã đọc/xóa
        await Notification.findByIdAndDelete(notificationId).session(session);

        await session.commitTransaction();
        res.status(200).json({ success: true, message: action === 'accept' ? "Gia nhập thành công" : "Đã từ chối" });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};
// LẤY CÁC LỜI MỜI MÀ TÔI NHẬN ĐƯỢC (Chưa chấp nhận)
export const getReceivedInvitations = async (req, res) => {
    try {
        const currentUserId = req.user._id || req.user.id;

        // Tìm trong bảng Member những bản ghi 'Invited' của user này
        const invites = await Member.find({
            userId: currentUserId,
            status: 'Invited' 
        })
        .populate('teamId', 'teamName sport categoryId tournamentId')
        .populate({
            path: 'teamId',
            populate: { path: 'tournamentId', select: 'displayName' }
        })
        .lean();

        return res.status(200).json({
            success: true,
            data: invites
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 1. CẬP NHẬT THÔNG TIN ĐỘI (Sửa tên)
export const updateTeam = async (req, res) => {
    try {
        const { id } = req.params;
        const { teamName } = req.body;
        const team = await Team.findById(id);

        if (team.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: "Chỉ chủ đội mới có quyền sửa!" });
        }

        team.teamName = teamName;
        await team.save();
        res.status(200).json({ success: true, message: "Cập nhật tên đội thành công!" });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// 2. XÓA ĐỘI (Hủy đăng ký)
export const deleteTeam = async (req, res) => {
    try {
        const { id } = req.params;
        const team = await Team.findById(id);

        if (team.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: "Chỉ chủ đội mới có quyền hủy đăng ký!" });
        }

        // Xóa tất cả thành viên của đội này trước
        await Member.deleteMany({ teamId: id });
        // Xóa đội
        await Team.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: "Đã hủy đăng ký và xóa đội thành công!" });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// 3. KÍCH THÀNH VIÊN HOẶC HỦY LỜI MỜI
export const removeMember = async (req, res) => {
    try {
        const { memberRecordId } = req.params;
        const member = await Member.findById(memberRecordId).populate('teamId');

        if (member.teamId.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: "Bạn không có quyền này!" });
        }

        if (member.role === 'Captain') {
            return res.status(400).json({ message: "Không thể xóa đội trưởng!" });
        }

        await Member.findByIdAndDelete(memberRecordId);
        res.status(200).json({ success: true, message: "Thao tác thành công!" });
    } catch (error) { res.status(500).json({ message: error.message }); }
};