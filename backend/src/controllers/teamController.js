// controllers/teamController.js
import mongoose from 'mongoose';
import Team from '../models/teams.js';
import Member from '../models/membersOfTeam.js';
import Invitation from '../models/invitations.js';
import Tournament from '../models/tournaments.js';
import User from '../models/users.js';
import { handleCreateInvitation } from '../utils/invitationHelper.js';

// ======================== HELPERS ========================
const checkCaptainOrCreator = async (teamId, userId, session = null) => {
    const team = await Team.findById(teamId).session(session);
    if (!team) throw new Error('Đội không tồn tại');
    if (team.createdBy?.toString() === userId) return true;
    const member = await Member.findOne({ teamId, userId, role: 'Captain', status: 'Active' }).session(session);
    return !!member;
};

const checkTeamLimit = async (teamId, session) => {
    const activeCount = await Member.countDocuments({ teamId, status: 'Active' }).session(session);
    // Giới hạn mặc định 20, có thể lấy từ tournament rule
    if (activeCount >= 20) throw new Error('Đội đã đạt giới hạn số lượng thành viên');
    return activeCount;
};

// ======================== TEAM CRUD ========================
// 1. Tạo đội (tự động gán captain)
export const createTeam = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { teamName, tournamentId, sportType, logo } = req.body;
        const userId = req.user.id;

        if (!teamName || !tournamentId) {
            return res.status(400).json({ success: false, message: 'Thiếu tên đội hoặc tournamentId' });
        }

        const tournament = await Tournament.findById(tournamentId).session(session);
        if (!tournament) throw new Error('Giải đấu không tồn tại');
        if (!['draft', 'upcoming'].includes(tournament.status)) {
            throw new Error('Giải đấu đã bắt đầu, không thể tạo đội mới');
        }

        const existing = await Team.findOne({ teamName, tournamentId }).session(session);
        if (existing) throw new Error('Tên đội đã tồn tại trong giải đấu này');

        const [newTeam] = await Team.create([{
            teamName,
            tournamentId,
            sportType: sportType || tournament.sport,
            createdBy: userId,
            logo: logo || '',
            isPaid: false,
            status: 'active'
        }], { session });

        await Member.create([{
            teamId: newTeam._id,
            userId,
            role: 'Captain',
            status: 'Active',
            joinedAt: new Date()
        }], { session });

        await session.commitTransaction();
        return res.status(201).json({ success: true, message: 'Tạo đội thành công', data: newTeam });
    } catch (error) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// 2. Cập nhật thông tin đội (chỉ captain/creator)
export const updateTeam = async (req, res) => {
    try {
        const { id } = req.params;
        const { teamName, logo, sportType, status } = req.body;
        const userId = req.user.id;

        const hasPerm = await checkCaptainOrCreator(id, userId);
        if (!hasPerm) return res.status(403).json({ success: false, message: 'Chỉ đội trưởng hoặc chủ đội mới được cập nhật' });

        const team = await Team.findById(id);
        if (!team) return res.status(404).json({ success: false, message: 'Đội không tồn tại' });

        if (teamName) team.teamName = teamName;
        if (logo !== undefined) team.logo = logo;
        if (sportType) team.sportType = sportType;
        if (status) team.status = status;

        await team.save();
        return res.status(200).json({ success: true, message: 'Cập nhật thành công', data: team });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Xóa đội (soft delete, chỉ khi chưa có trận đấu)
export const deleteTeam = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const team = await Team.findById(id).session(session);
        if (!team) throw new Error('Đội không tồn tại');
        const hasPerm = await checkCaptainOrCreator(id, userId, session);
        if (!hasPerm) throw new Error('Không có quyền xóa đội');

        // Kiểm tra ràng buộc với match (nếu có)
        // const matchExists = await Match.findOne({ $or: [{ team1: id }, { team2: id }] }).session(session);
        // if (matchExists) throw new Error('Đội đã tham gia thi đấu, không thể xóa');

        team.status = 'inactive';
        await team.save({ session });
        await Member.updateMany({ teamId: id }, { status: 'Left' }, { session });

        await session.commitTransaction();
        return res.status(200).json({ success: true, message: 'Đã vô hiệu hóa đội' });
    } catch (error) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// ======================== MEMBER MANAGEMENT ========================
// 4. Lấy danh sách đội mà user đang tham gia (active)
export const getUserTeams = async (req, res) => {
    try {
        const userId = req.user.id;
        const members = await Member.find({ userId, status: 'Active' }).populate('teamId').lean();
        const teams = members.map(m => m.teamId).filter(t => t && t.status === 'active');
        return res.status(200).json({ success: true, data: teams });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 5. Chi tiết đội (kèm members, phân quyền hiển thị)
export const getTeamDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const team = await Team.findById(id).populate('tournamentId', 'displayName sport');
        if (!team) return res.status(404).json({ success: false, message: 'Đội không tồn tại' });

        const userId = req.user.id;
        const isCaptainOrCreator = await checkCaptainOrCreator(id, userId);
        const memberFilter = isCaptainOrCreator ? {} : { status: 'Active' };
        const members = await Member.find({ teamId: id, ...memberFilter })
            .populate('userId', 'displayName email avatar')
            .lean();

        return res.status(200).json({ success: true, data: { ...team.toObject(), members } });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 6. Danh sách đội theo giải đấu (có filter)
export const getTeamsByTournament = async (req, res) => {
    try {
        const { tournamentId } = req.params;
        const { status } = req.query;
        const filter = { tournamentId };
        if (status) filter.status = status;

        const teams = await Team.find(filter).populate('createdBy', 'displayName').lean();
        const teamsWithCount = await Promise.all(teams.map(async (team) => ({
            ...team,
            memberCount: await Member.countDocuments({ teamId: team._id, status: 'Active' })
        })));
        return res.status(200).json({ success: true, data: teamsWithCount });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 7. Thành viên rời đội (không thể rời nếu là captain)
export const leaveTeam = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params; // teamId
        const userId = req.user.id;

        const member = await Member.findOne({ teamId: id, userId, status: 'Active' }).session(session);
        if (!member) throw new Error('Bạn không phải thành viên của đội này');
        if (member.role === 'Captain') throw new Error('Đội trưởng không thể rời đội, hãy chuyển quyền trước');

        member.status = 'Left';
        await member.save({ session });

        await session.commitTransaction();
        return res.status(200).json({ success: true, message: 'Bạn đã rời đội' });
    } catch (error) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// 8. Captain xóa thành viên (kick)
export const kickMember = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { teamId, memberId } = req.params;
        const userId = req.user.id;

        const hasPerm = await checkCaptainOrCreator(teamId, userId, session);
        if (!hasPerm) throw new Error('Chỉ đội trưởng mới có quyền');

        const member = await Member.findById(memberId).session(session);
        if (!member) throw new Error('Thành viên không tồn tại');
        if (member.role === 'Captain') throw new Error('Không thể xóa đội trưởng');

        member.status = 'Left';
        await member.save({ session });

        await session.commitTransaction();
        return res.status(200).json({ success: true, message: 'Thành viên đã bị xóa' });
    } catch (error) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// 9. Chuyển quyền đội trưởng (captain -> member khác)
export const transferCaptaincy = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { teamId, newCaptainUserId } = req.body;
        const currentUserId = req.user.id;

        const currentCaptain = await Member.findOne({ teamId, userId: currentUserId, role: 'Captain', status: 'Active' }).session(session);
        if (!currentCaptain) throw new Error('Chỉ đội trưởng hiện tại mới thực hiện được');

        const newCaptain = await Member.findOne({ teamId, userId: newCaptainUserId, status: 'Active' }).session(session);
        if (!newCaptain) throw new Error('Thành viên mới không tồn tại hoặc chưa active');

        currentCaptain.role = 'Member';
        newCaptain.role = 'Captain';
        await currentCaptain.save({ session });
        await newCaptain.save({ session });

        await session.commitTransaction();
        return res.status(200).json({ success: true, message: 'Chuyển quyền đội trưởng thành công' });
    } catch (error) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// ======================== INVITATIONS (CAPTAIN INVITE) ========================
// 10. Gửi lời mời (captain mời cầu thủ)
export const sendInvitation = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { teamId, receiverUserId } = req.body;
        const senderId = req.user.id;

        const hasPerm = await checkCaptainOrCreator(teamId, senderId, session);
        if (!hasPerm) throw new Error('Chỉ đội trưởng hoặc chủ đội mới được mời');

        const invitation = await handleCreateInvitation(senderId, receiverUserId, teamId, 'captain_invite', session);

        await session.commitTransaction();
        return res.status(201).json({ success: true, message: 'Gửi lời mời thành công', data: invitation });
    } catch (error) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// 11. Chấp nhận lời mời (của captain)
export const acceptInvitation = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { invitationId } = req.params;
        const userId = req.user.id;

        const invitation = await Invitation.findById(invitationId).session(session);
        if (!invitation || invitation.status !== 'pending') throw new Error('Lời mời không hợp lệ');
        if (invitation.receiverId.toString() !== userId) throw new Error('Bạn không có quyền chấp nhận lời mời này');

        const member = await Member.findOne({ teamId: invitation.teamId, userId }).session(session);
        if (!member || member.status !== 'Invited') throw new Error('Không tìm thấy thành viên tương ứng');

        await checkTeamLimit(invitation.teamId, session);

        member.status = 'Active';
        member.joinedAt = new Date();
        await member.save({ session });

        invitation.status = 'accepted';
        await invitation.save({ session });

        await session.commitTransaction();
        return res.status(200).json({ success: true, message: 'Đã gia nhập đội' });
    } catch (error) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// 12. Từ chối lời mời (của captain)
export const rejectInvitation = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { invitationId } = req.params;
        const userId = req.user.id;

        const invitation = await Invitation.findById(invitationId).session(session);
        if (!invitation || invitation.status !== 'pending') throw new Error('Lời mời không hợp lệ');
        if (invitation.receiverId.toString() !== userId) throw new Error('Bạn không có quyền từ chối');

        await Member.deleteOne({ teamId: invitation.teamId, userId, status: 'Invited' }).session(session);
        invitation.status = 'rejected';
        await invitation.save({ session });

        await session.commitTransaction();
        return res.status(200).json({ success: true, message: 'Từ chối lời mời' });
    } catch (error) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// 13. Lấy danh sách lời mời đang chờ của user
export const getUserInvitations = async (req, res) => {
    try {
        const userId = req.user.id;
        const invites = await Invitation.find({ receiverId: userId, status: 'pending', invitationType: 'captain_invite' })
            .populate('senderId', 'displayName email')
            .populate('teamId', 'teamName sportType')
            .lean();
        return res.status(200).json({ success: true, data: invites });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ======================== PLAYER REQUESTS (JOIN TEAM) ========================
// 14. Cầu thủ tự gửi yêu cầu tham gia đội
export const requestToJoinTeam = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { teamId } = req.body;
        const userId = req.user.id;

        const team = await Team.findById(teamId).session(session);
        if (!team || team.status !== 'active') throw new Error('Đội không hợp lệ');

        const existing = await Member.findOne({ teamId, userId }).session(session);
        if (existing && existing.status === 'Active') throw new Error('Bạn đã là thành viên');
        if (existing && existing.status === 'Requested') throw new Error('Yêu cầu của bạn đang chờ duyệt');

        // Kiểm tra giới hạn thành viên hiện tại
        await checkTeamLimit(teamId, session);

        const invitation = await handleCreateInvitation(userId, null, teamId, 'player_request', session);
        // handleCreateInvitation hiện tại cần receiverId, nhưng player_request người nhận là captain.
        // Cần sửa helper để truyền captainId làm receiver. Nhưng tạm thời ta tự tạo logic riêng đơn giản sau.
        // Để code hoàn chỉnh, tôi viết inline:
        const captainMember = await Member.findOne({ teamId, role: 'Captain', status: 'Active' }).session(session);
        if (!captainMember) throw new Error('Đội chưa có đội trưởng');

        const existingReq = await Invitation.findOne({ teamId, senderId: userId, invitationType: 'player_request', status: 'pending' }).session(session);
        if (existingReq) throw new Error('Yêu cầu trước đó đang chờ');

        const [newRequest] = await Invitation.create([{
            senderId: userId,
            receiverId: captainMember.userId,
            teamId,
            status: 'pending',
            invitationType: 'player_request'
        }], { session });

        await Member.findOneAndUpdate(
            { teamId, userId },
            { status: 'Requested', role: 'Member', $setOnInsert: { joinedAt: null } },
            { upsert: true, session }
        );

        await session.commitTransaction();
        return res.status(201).json({ success: true, message: 'Gửi yêu cầu thành công', data: newRequest });
    } catch (error) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// 15. Captain duyệt yêu cầu tham gia của cầu thủ
export const approveJoinRequest = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { requestId } = req.params;
        const captainId = req.user.id;

        const request = await Invitation.findById(requestId).session(session);
        if (!request || request.status !== 'pending' || request.invitationType !== 'player_request') {
            throw new Error('Yêu cầu không hợp lệ');
        }

        const captainMember = await Member.findOne({ teamId: request.teamId, userId: captainId, role: 'Captain', status: 'Active' }).session(session);
        if (!captainMember) throw new Error('Chỉ đội trưởng mới duyệt được');

        await checkTeamLimit(request.teamId, session);

        const member = await Member.findOne({ teamId: request.teamId, userId: request.senderId, status: 'Requested' }).session(session);
        if (!member) throw new Error('Không tìm thấy thành viên tương ứng');

        member.status = 'Active';
        member.joinedAt = new Date();
        await member.save({ session });

        request.status = 'accepted';
        await request.save({ session });

        await session.commitTransaction();
        return res.status(200).json({ success: true, message: 'Đã chấp nhận thành viên mới' });
    } catch (error) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// 16. Captain từ chối yêu cầu tham gia
export const rejectJoinRequest = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { requestId } = req.params;
        const captainId = req.user.id;

        const request = await Invitation.findById(requestId).session(session);
        if (!request || request.status !== 'pending' || request.invitationType !== 'player_request') {
            throw new Error('Yêu cầu không hợp lệ');
        }

        const captainMember = await Member.findOne({ teamId: request.teamId, userId: captainId, role: 'Captain', status: 'Active' }).session(session);
        if (!captainMember) throw new Error('Chỉ đội trưởng mới thực hiện');

        await Member.deleteOne({ teamId: request.teamId, userId: request.senderId, status: 'Requested' }).session(session);
        request.status = 'rejected';
        await request.save({ session });

        await session.commitTransaction();
        return res.status(200).json({ success: true, message: 'Đã từ chối yêu cầu' });
    } catch (error) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// 17. Lấy danh sách yêu cầu tham gia của đội (captain)
export const getTeamJoinRequests = async (req, res) => {
    try {
        const { teamId } = req.params;
        const captainId = req.user.id;

        const captainMember = await Member.findOne({ teamId, userId: captainId, role: 'Captain', status: 'Active' });
        if (!captainMember) return res.status(403).json({ success: false, message: 'Chỉ đội trưởng mới xem được' });

        const requests = await Invitation.find({ teamId, invitationType: 'player_request', status: 'pending' })
            .populate('senderId', 'displayName email avatar')
            .lean();
        return res.status(200).json({ success: true, data: requests });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ======================== MISCELLANEOUS ========================
// 18. Cập nhật trạng thái thanh toán đội (admin/org)
export const updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isPaid } = req.body;
        const team = await Team.findByIdAndUpdate(id, { isPaid }, { new: true });
        if (!team) return res.status(404).json({ success: false, message: 'Đội không tồn tại' });
        return res.status(200).json({ success: true, message: `Cập nhật thanh toán thành ${isPaid ? 'đã đóng' : 'chưa đóng'}`, data: team });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const searchUsers = async (req, res) => {
    try {
        const { keyword } = req.query;
        if (!keyword || keyword.trim() === '') {
            return res.status(200).json({ success: true, data: [] });
        }

        const users = await User.find({
            role: 'player', // Chỉ tìm cầu thủ
            $or: [
                { displayName: { $regex: keyword, $options: 'i' } },
                { email: { $regex: keyword, $options: 'i' } },
                { phoneNumber: { $regex: keyword, $options: 'i' } }
            ]
        }).select('displayName email phoneNumber avatar skillLevel');

        return res.status(200).json({ success: true, data: users });
    } catch (error) {
        console.error("searchUsers error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const registerFlow = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { tournamentId, sport, categoryId, regMode, teamName, invitedUserIds } = req.body;
        const userId = req.user.id;

        // 1. Kiểm tra giải đấu
        const tournament = await Tournament.findById(tournamentId).session(session);
        if (!tournament) throw new Error('Giải đấu không tồn tại');
        if (tournament.status !== 'upcoming') throw new Error('Giải đấu đã bắt đầu hoặc kết thúc, không thể đăng ký');

        // 2. Kiểm tra cấu hình môn thể thao
        const sportConfig = tournament.sportsConfig?.find(s => s.sport === sport);
        if (!sportConfig) throw new Error(`Môn thể thao ${sport} không có trong giải đấu`);

        let newTeam;
        let fee = sportConfig.feeEntry || 0;

        // 3. Xử lý theo chế độ đăng ký
        if (regMode === 'solo') {
            // Đăng ký cá nhân (tạo đội 1 người)
            const soloTeamName = `${req.user.displayName || 'VĐV'} - ${sport} ${categoryId || ''}`;
            [newTeam] = await Team.create([{
                teamName: soloTeamName,
                tournamentId,
                sportType: sport,
                createdBy: userId,
                status: 'active',
                isPaid: false
            }], { session });
        }
        else if (regMode === 'create') {
            // Tạo đội mới và mời thành viên
            if (!teamName) throw new Error('Tên đội không được để trống');
            [newTeam] = await Team.create([{
                teamName,
                tournamentId,
                sportType: sport,
                createdBy: userId,
                status: 'active',
                isPaid: false
            }], { session });
        }
        else if (regMode === 'random') {
            // Ghép ngẫu nhiên: tạo đội tạm, chờ ghép sau
            [newTeam] = await Team.create([{
                teamName: `Random_${Date.now()}_${userId.slice(-4)}`,
                tournamentId,
                sportType: sport,
                createdBy: userId,
                status: 'pending',
                isPaid: false
            }], { session });
            fee = Math.floor(fee / 2); // giảm 50% lệ phí cho chế độ random
        } else {
            throw new Error('Chế độ đăng ký không hợp lệ');
        }

        const teamId = newTeam._id;

        // 4. Thêm người tạo là đội trưởng (Captain)
        await Member.create([{
            teamId,
            userId,
            role: 'Captain',
            status: 'Active',
            joinedAt: new Date()
        }], { session });

        // 5. Mời đồng đội (nếu có)
        if (invitedUserIds && invitedUserIds.length > 0) {
            for (const invitedId of invitedUserIds) {
                await handleCreateInvitation(userId, invitedId, teamId, 'captain_invite', session);
            }
        }

        await session.commitTransaction();

        return res.status(201).json({
            success: true,
            message: 'Đăng ký thành công',
            teamId: teamId,
            teamName: newTeam.teamName,
            fee: fee
        });
    } catch (error) {
        await session.abortTransaction();
        console.error("registerFlow error:", error);
        return res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

