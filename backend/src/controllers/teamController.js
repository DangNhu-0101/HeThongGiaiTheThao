import express from 'express';
import mongoose from 'mongoose';
import Team from '../models/teams.js'; 
import Rule from '../models/Rule/baseRules.js';
import Tournament from '../models/tournament.js';
import PlayerModel from '../models/players.js'; 
import Member from '../models/members.js';
import User from '../models/User.js';
// Đã xóa import Invitation vì không còn dùng collection này nữa
import Notification from '../models/Notification.js';
import handleCreateInvitation from '../utils/invitationHelper.js';

export const handleRandomMatching = async (currentUserId, tournamentId, ruleId, mySkill, session) => {
    const mySkillNum = parseFloat(mySkill);

    // Xây dựng vùng Skill an toàn (Chênh lệch tối đa 1.5)
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

        // 7. THÔNG BÁO CHO CHÍNH CHỦ ĐỘI
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
        const currentId = req.user.id;

        if (!teamName) {
            return res.status(400).json({ message: "Vui lòng nhập tên đội bóng!" });
        }
        if(!tournamentName) {
            return res.status(400).json({ message: "Vui lòng nhập tên giải đấu!" });
        }
        
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

// GỬI LỜI MỜI
export const sendInvitation = async (req, res) => {
    try {
        const { teamId, userReceive } = req.body;
        const senderId = req.user._id || req.user.id;

        const team = await Team.findById(teamId);
        const receiver = await User.findById(userReceive);

        // 1. Tạo Member record (giữ chỗ)
        await Member.create({ teamId, userId: userReceive, status: 'Invited' });

        // 2. THÔNG BÁO CHO NGƯỜI NHẬN
        await Notification.create({
            userId: userReceive,
            type: 'INVITATION',
            title: '📩 Lời mời gia nhập đội',
            message: `Bạn có lời mời gia nhập đội "${team.teamName}" từ ${req.user.displayName}.`,
            metadata: { teamId, invitedBy: senderId }
        });

        // 3. THÔNG BÁO CHO NGƯỜI GỬI
        await Notification.create({
            userId: senderId,
            type: 'SYSTEM',
            title: '📤 Đã gửi lời mời',
            message: `Bạn đã gửi lời mời đến ${receiver.displayName}. Khi họ phản hồi, chúng tôi sẽ thông báo cho bạn ngay.`,
            metadata: { teamId }
        });

        return res.status(201).json({ success: true, message: "Đã gửi lời mời cho cả 2 bên!" });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

// ==========================================
// ĐÃ GỘP ACCEPT VÀ REJECT VÀO HÀM NÀY
// ==========================================
export const respondInvitation = async (req, res) => {
    const { notificationId, teamId, action } = req.body; // action: 'accept' hoặc 'reject'
    const currentUserId = req.user._id || req.user.id;

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const team = await Team.findById(teamId).populate({
            path: 'tournamentId',
            populate: { path: 'rules' }
        }).session(session);

        if (!team) throw new Error("Đội bóng không còn tồn tại.");

        if (action === 'accept') {
            // 1. Kiểm tra giới hạn thành viên (Roster Limit) từ Rule của giải đấu
            if (team.tournamentId && team.tournamentId.rules) {
                const correctRule = team.tournamentId.rules.find(
                    rule => rule.sportType === team.sport
                );

                if (correctRule) {
                    const maxPlayers = correctRule.rosterConfig?.maxParticipantsPerSide || 99;
                    const currentActiveMembers = await Member.countDocuments({
                        teamId: teamId,
                        status: 'Active'
                    }).session(session);

                    if (currentActiveMembers >= maxPlayers) {
                        throw new Error(`Đội đã đạt giới hạn tối đa ${maxPlayers} người cho môn thi đấu này.`);
                    }
                }
            }

            // 2. Chuyển status từ Invited sang Active
            const updatedMember = await Member.findOneAndUpdate(
                { teamId, userId: currentUserId, status: 'Invited' },
                { status: 'Active', joinedAt: Date.now() },
                { new: true, session }
            );

            if (!updatedMember) {
                throw new Error("Không tìm thấy lời mời hợp lệ hoặc bạn đã thao tác rồi.");
            }

            // 3. Thông báo cho Đội trưởng biết có người vừa vào
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
        if (notificationId) {
            await Notification.findByIdAndDelete(notificationId).session(session);
        }

        await session.commitTransaction();
        res.status(200).json({ success: true, message: action === 'accept' ? "Gia nhập thành công" : "Đã từ chối" });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// LẤY TẤT CẢ ĐỘI (BẢN PHÒNG THỦ CAO)
export const getAllTeam = async (req, res) => {
    try {
        const teams = await Team.find()
            .populate('tournamentId', 'displayName year')
            .populate('createdBy', 'displayName')
            .lean();

        if (!teams) return res.status(200).json({ success: true, data: [] });

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

        const team = await Team.findById(id).populate('tournamentId', 'displayName year location sportsConfig paymentQR').populate('createdBy', 'displayName').lean();
        if (!team) return res.status(404).json({ message: "Không tìm thấy đội bóng." });

        const members = await Member.find({ teamId: id })
            .populate('userId', 'displayName avatarUrl email')
            .populate('playerId', 'position skillLevel')
            .lean();

        const data = {
            ...team,
            members: members
        };

        return res.status(200).json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
    }
};

// LẤY DANH SÁCH ĐỘI TRONG 1 GIẢI ĐẤU
export const getTeamsByTournament = async (req, res) => {
    try {
        const { tournamentId } = req.params;

        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) {
            return res.status(404).json({ 
                success: false,
                message: "Giải đấu không tồn tại", 
                data: [] 
            });
        }

        let teams = await Team.find({ 
            $or: [
                { tournamentId: tournamentId },
                { tournamentId: null },
                { tournamentId: { $exists: false } }
            ]
        })
            .populate('createdBy', 'displayName')
            .lean();

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

export const updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params; 
        const { isPaid } = req.body; 

        const updatedTeam = await Team.findByIdAndUpdate(
            id,
            { $set: { isPaid: isPaid } },
            { new: true } 
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

        const myTeams = await Team.find({ createdBy: currentUserId }).select('_id');
        const myTeamIds = myTeams.map(t => t._id);

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
        const { memberRecordId } = req.params; 
        const senderId = req.user._id || req.user.id;

        const memberInvite = await Member.findById(memberRecordId).populate('teamId');
        
        if (!memberInvite) throw new Error("Lời mời không tồn tại hoặc đã bị hủy.");

        if (memberInvite.teamId.createdBy.toString() !== senderId.toString()) {
            throw new Error("Bạn không có quyền thu hồi lời mời này!");
        }

        if (memberInvite.status !== 'Invited') {
            throw new Error("Người này đã tham gia đội, không thể thu hồi lời mời.");
        }

        await Member.findByIdAndDelete(memberRecordId).session(session);

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

// LẤY CÁC LỜI MỜI MÀ TÔI NHẬN ĐƯỢC (Chưa chấp nhận)
export const getReceivedInvitations = async (req, res) => {
    try {
        const currentUserId = req.user._id || req.user.id;

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

        await Member.deleteMany({ teamId: id });
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

export const sumitpayment = async (req, res) => {
    try {
        const { teamId } = req.params;
        const team = await Team.findById(teamId);

        if (!team) {
            return res.status(404).json({ message: "Không tìm thấy đội bóng." });
        }
        if (team.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: "Bạn không có quyền này!" });
        }
        team.status = 'pending_payment';
        await team.save();  
        res.status(200).json({ success: true, message: "Đã gửi yêu cầu thanh toán. Vui lòng chờ phê duyệt!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }   
};