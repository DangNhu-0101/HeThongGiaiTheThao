// controllers/teamController.js
import mongoose from 'mongoose';
import Team from '../models/teams.js';
import Member from '../models/membersOfTeam.js';
import Invitation from '../models/invitations.js';
import Tournament from '../models/tournaments.js';
import User from '../models/users.js';
import Players from '../models/players.js';
import { handleCreateInvitation } from '../utils/invitationHelper.js';

// ======================== HELPERS ========================
const checkCaptainOrCreator = async (teamId, userId, session = null) => {
    const team = await Team.findById(teamId).session(session);
    if (!team) throw new Error('Đội không tồn tại');
    if (team.ownerId?.toString() === userId) return true;
    const member = await Member.findOne({ teamId, userId, role: 'Captain', status: 'active' }).session(session);
    return !!member;
};

const checkTeamLimit = async (teamId, session) => {
    const activeCount = await Member.countDocuments({ teamId, status: 'active' }).session(session);
    if (activeCount >= 20) throw new Error('Đội đã đạt giới hạn số lượng thành viên');
    return activeCount;
};

// ======================== TEAM CRUD ========================
// 1. Tạo đội (tự động gán captain)
export const createTeam = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { teamName, tournamentId, sportType, sportCategory, logo } = req.body;
        const userId = req.user.id;

        if (!teamName || !tournamentId || !sportCategory) {
            return res.status(400).json({ success: false, message: 'Thiếu tên đội, tournamentId hoặc sportCategory' });
        }

        const tournament = await Tournament.findById(tournamentId).session(session);
        if (!tournament) throw new Error('Giải đấu không tồn tại');
        if (!['draft', 'upcoming'].includes(tournament.status)) {
            throw new Error('Giải đấu đã bắt đầu, không thể tạo đội mới');
        }

        const existing = await Team.findOne({ name: teamName, tournamentId }).session(session);
        if (existing) throw new Error('Tên đội đã tồn tại trong giải đấu này');

        const [newTeam] = await Team.create([{
            name: teamName,
            tournamentId,
            sportCategory: sportCategory || sportType || tournament.sport,
            ownerId: userId,
            logo: logo || '',
            status: 'validated'
        }], { session });

        await Member.create([{
            teamId: newTeam._id,
            userId,
            role: 'Captain',
            status: 'active',
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

// 2. Cập nhật thông tin đội
export const updateTeam = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, logo, sportType, sportCategory, status } = req.body;
        const userId = req.user.id;

        const hasPerm = await checkCaptainOrCreator(id, userId);
        if (!hasPerm) return res.status(403).json({ success: false, message: 'Chỉ đội trưởng hoặc chủ đội mới được cập nhật' });

        const team = await Team.findById(id);
        if (!team) return res.status(404).json({ success: false, message: 'Đội không tồn tại' });

        if (name) team.name = name;
        if (logo !== undefined) team.logo = logo;
        if (sportType) team.sportType = sportType;
        if (sportCategory) team.sportCategory = sportCategory;
        if (status) team.status = status;

        await team.save();
        return res.status(200).json({ success: true, message: 'Cập nhật thành công', data: team });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Xóa đội (soft delete)
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

        team.status = 'eliminated';
        await team.save({ session });
        await Member.updateMany({ teamId: id }, { status: 'Rejected' }, { session });

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
// 4. Lấy danh sách đội user tham gia
export const getUserTeams = async (req, res) => {
    try {
        const userId = req.user.id;
        const members = await Member.find({ userId, status: 'active' })
            .populate({
                path: 'teamId',
                populate: {
                    path: 'tournamentId',
                    select: 'name sportType sport'
                }
            })
            .lean();
            
        const teams = members
            .map(m => m.teamId)
            .filter(t => t && t.status !== 'eliminated');
            
        return res.status(200).json({ success: true, data: teams });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 5. Chi tiết đội
export const getTeamDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const team = await Team.findById(id)
            .populate('tournamentId', 'name')
            .populate('ownerId', 'username email')
            .lean();
            
        if (!team) return res.status(404).json({ success: false, message: 'Đội không tồn tại' });

        const userId = req.user?.id;
        // Bỏ dòng này vì không cần thiết và gây lỗi
        // const player = await Player.findById(userId).select('role').lean();
        
        const isCaptainOrCreator = userId ? await checkCaptainOrCreator(id, userId) : false;
        const memberFilter = isCaptainOrCreator ? {} : { status: 'active' };
        const members = await Member.find({ teamId: id, ...memberFilter })
            .populate('userId', 'username email')
            .lean();

        return res.status(200).json({ success: true, data: { ...team, members } });
    } catch (error) {
        console.error("getTeamDetail error:", error.message); // ← Xem log này
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 6. Danh sách đội theo giải đấu
export const getTeamsByTournament = async (req, res) => {
    try {
        const tournamentId = req.params.tournamentId || req.query.tournamentId || null;
        const { status } = req.query;
        
        const filter = {};
        if (tournamentId) filter.tournamentId = tournamentId;
        if (status) filter.status = status;
        if (!tournamentId && !status) filter.status = { $in: ['validated', 'confirmed', 'playing'] };
        
        const teams = await Team.find(filter)
            .populate('ownerId', 'username email')
            .lean();
        
        const teamsWithCount = await Promise.all(teams.map(async (team) => ({
            ...team,
            memberCount: await Member.countDocuments({ teamId: team._id, status: 'active' })
        })));
        
        return res.status(200).json({ success: true, count: teamsWithCount.length, data: teamsWithCount });
    } catch (error) {
        console.error("getTeamsByTournament ERROR:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 7. Thành viên rời đội
export const leaveTeam = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const member = await Member.findOne({ teamId: id, userId, status: 'active' }).session(session);
        if (!member) throw new Error('Bạn không phải thành viên của đội này');
        if (member.role === 'Captain') throw new Error('Đội trưởng không thể rời đội, hãy chuyển quyền trước');

        member.status = 'Rejected';
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

        member.status = 'Rejected';
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

// 9. Chuyển quyền đội trưởng
export const transferCaptaincy = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { teamId, newCaptainUserId } = req.body;
        const currentUserId = req.user.id;

        const currentCaptain = await Member.findOne({ teamId, userId: currentUserId, role: 'Captain', status: 'active' }).session(session);
        if (!currentCaptain) throw new Error('Chỉ đội trưởng hiện tại mới thực hiện được');

        const newCaptain = await Member.findOne({ teamId, userId: newCaptainUserId, status: 'active' }).session(session);
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

// ======================== INVITATIONS (CAPTAIN INVITES) ========================
// 10. Gửi lời mời
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

// 11. Chấp nhận lời mời
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

        member.status = 'active';
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

// 12. Từ chối lời mời
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

// 13. Lấy danh sách lời mời đang chờ
export const getUserInvitations = async (req, res) => {
    try {
        const userId = req.user.id;
        const invites = await Invitation.find({ receiverId: userId, status: 'pending', invitationType: 'captain_invite' })
            .populate('senderId', 'username email')
            .populate('teamId', 'name sportCategory')
            .lean();
        return res.status(200).json({ success: true, data: invites });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ======================== PLAYER REQUESTS (JOIN TEAM) ========================
// 14. Cầu thủ gửi yêu cầu tham gia
export const requestToJoinTeam = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { teamId } = req.body;
        const userId = req.user.id;

        const team = await Team.findById(teamId).session(session);
        if (!team || !['validated', 'confirmed'].includes(team.status)) throw new Error('Đội không hợp lệ');

        const existing = await Member.findOne({ teamId, userId }).session(session);
        if (existing && existing.status === 'active') throw new Error('Bạn đã là thành viên');
        if (existing && existing.status === 'Pending') throw new Error('Yêu cầu của bạn đang chờ duyệt');

        await checkTeamLimit(teamId, session);

        const captainMember = await Member.findOne({ teamId, role: 'Captain', status: 'active' }).session(session);
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
            { status: 'Pending', role: 'Member', $setOnInsert: { joinedAt: null } },
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

// 15. Captain duyệt yêu cầu
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

        const captainMember = await Member.findOne({ teamId: request.teamId, userId: captainId, role: 'Captain', status: 'active' }).session(session);
        if (!captainMember) throw new Error('Chỉ đội trưởng mới duyệt được');

        await checkTeamLimit(request.teamId, session);

        const member = await Member.findOne({ teamId: request.teamId, userId: request.senderId, status: 'Pending' }).session(session);
        if (!member) throw new Error('Không tìm thấy thành viên tương ứng');

        member.status = 'active';
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

// 16. Captain từ chối yêu cầu
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

        const captainMember = await Member.findOne({ teamId: request.teamId, userId: captainId, role: 'Captain', status: 'active' }).session(session);
        if (!captainMember) throw new Error('Chỉ đội trưởng mới thực hiện');

        await Member.deleteOne({ teamId: request.teamId, userId: request.senderId, status: 'Pending' }).session(session);
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
export const getSentInvitations = async (req, res) => {
    try {
        const userId = req.user.id;  // TÔI
        const invites = await Invitation.find({ 
            senderId: userId,        // ← TÔI là người GỬI
            status: 'pending'
        })
            .populate('receiverId', 'username email')  // ← Người được TÔI mời
            .populate('teamId', 'name sportCategory')  // ← Đội TÔI mời vào
            .lean();
        return res.status(200).json({ success: true, data: invites });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
// 17. Lấy danh sách yêu cầu của đội
export const getTeamJoinRequests = async (req, res) => {
    try {
        const { teamId } = req.params;
        const captainId = req.user.id;

        const captainMember = await Member.findOne({ teamId, userId: captainId, role: 'Captain', status: 'active' });
        if (!captainMember) return res.status(403).json({ success: false, message: 'Chỉ đội trưởng mới xem được' });

        const requests = await Invitation.find({ teamId, invitationType: 'player_request', status: 'pending' })
            .populate('senderId', 'username email')
            .lean();
        return res.status(200).json({ success: true, data: requests });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ======================== MISCELLANEOUS ========================
// 18. Cập nhật thanh toán
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

// 19. Tìm kiếm users
export const searchUsers = async (req, res) => {
    try {
        const { keyword } = req.query;
        if (!keyword || keyword.trim() === '') {
            return res.status(200).json({ success: true, data: [] });
        }

        const users = await User.find({
            role: 'player',
            $or: [
                { username: { $regex: keyword, $options: 'i' } },
                { email: { $regex: keyword, $options: 'i' } },
            ]
        }).select('username email role _id').lean();

        const userIds = users.map(u => u._id);
        const players = await Players.find({ userId: { $in: userIds } }, 'name level userId').lean();
        const playerMap = {};
        players.forEach(p => { playerMap[p.userId.toString()] = p; });

        const result = users.map(u => ({
            ...u,
            playerInfo: playerMap[u._id.toString()] || null
        }));

        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error("searchUsers error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 20. Đăng ký tham gia giải đấu
export const registerFlow = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { tournamentId, sport, categoryId, regMode, teamName, invitedUserIds } = req.body;
        const userId = req.user.id;

        const tournament = await Tournament.findById(tournamentId).session(session);
        if (!tournament) throw new Error('Giải đấu không tồn tại');
        if (tournament.status !== 'upcoming') throw new Error('Giải đấu đã bắt đầu hoặc kết thúc, không thể đăng ký');

        const sportConfig = tournament.sportsConfig?.find(s => s.sport === sport);
        if (!sportConfig) throw new Error(`Môn thể thao ${sport} không có trong giải đấu`);

        let newTeam;
        let fee = sportConfig.feePerAthlete || sportConfig.playerEntryFee || 0;

        if (regMode === 'solo') {
            const soloTeamName = `${req.user.username || 'VĐV'} - ${sport} ${categoryId || ''}`;
            [newTeam] = await Team.create([{
                name: soloTeamName,
                tournamentId,
                sportCategory: categoryId,
                ownerId: userId,
                status: 'validated'
            }], { session });
        }
        else if (regMode === 'create') {
            if (!teamName) throw new Error('Tên đội không được để trống');
            [newTeam] = await Team.create([{
                name: teamName,
                tournamentId,
                sportCategory: categoryId,
                ownerId: userId,
                status: 'validated'
            }], { session });
        }
        else if (regMode === 'random') {
            [newTeam] = await Team.create([{
                name: `Random_${Date.now()}_${userId.slice(-4)}`,
                tournamentId,
                sportCategory: categoryId,
                ownerId: userId,
                status: 'pending'
            }], { session });
            fee = Math.floor(fee / 2);
        } else {
            throw new Error('Chế độ đăng ký không hợp lệ');
        }

        const teamId = newTeam._id;

        await Member.create([{
            teamId,
            userId,
            role: 'Captain',
            status: 'active',
            joinedAt: new Date()
        }], { session });

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
            teamName: newTeam.name,
            fee: fee
        });
    } catch (error) {
        await session.abortTransaction();
        console.error("registerFlow error:", error.message);
        return res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};