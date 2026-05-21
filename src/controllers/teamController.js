// controllers/teamController.js
import mongoose from 'mongoose';
import Team from '../models/teams.js';
import Member from '../models/membersOfTeam.js';
import Invitation from '../models/invitations.js';
import Tournament from '../models/tournaments.js';
import User from '../models/users.js';
import Player from '../models/players.js';
import BaseRule from "../models/rules/baseRules.js"
import CategoryRule from '../models/rules/categories.js';
import { handleCreateInvitation } from '../utils/invitationHelper.js';

// ======================== HELPERS ========================
const checkCaptainOrCreator = async (teamId, userId, session = null) => {
    const team = await Team.findById(teamId).session(session);
    if (!team) throw new Error('Đội không tồn tại');
    if (team.ownerId?.toString() === userId) return true;
    const member = await Member.findOne({ teamId, userId, role: 'Captain', status: 'Active' }).session(session);
    return !!member;
};

// Helper function to get required players by category
const getRequiredPlayersByCategory = async (tournamentId, sportType, categoryId) => {
    try {
        // Tìm base rule cho tournament và sport
        const baseRule = await BaseRule.findOne({ 
            tournamentId: tournamentId, 
            sport: sportType 
        }).populate('tournamentStructure.categories');
        
        if (baseRule && baseRule.tournamentStructure?.categories) {
            // Tìm category phù hợp
            for (const catRule of baseRule.tournamentStructure.categories) {
                if (catRule.categories && catRule.categories.length > 0) {
                    const foundCat = catRule.categories.find(c => c.id === categoryId || c.name === categoryId);
                    if (foundCat && foundCat.minPlayers) {
                        return foundCat.minPlayers;
                    }
                }
            }
        }
        
        // Default: 5 players if no rule found
        return 5;
    } catch (error) {
        console.error("Error getting required players:", error);
        return 5;
    }
};

const checkTeamLimit = async (teamId, session) => {
    const team = await Team.findById(teamId).session(session);
    if (!team) {
        throw new Error('Đội không tồn tại');
    }
    const required = await getRequiredPlayersByCategory(team.tournamentId, team.sportType, team.categoryId);
    const current = await Member.countDocuments({ teamId, status: 'Active' }).session(session);
    if (current >= required) {
        throw new Error(`Đội đã đủ ${required} thành viên (category ${team.categoryId})`);
    }
    return { current, required };
};

// ======================== TEAM CRUD ========================
// 1. Tạo đội (tự động gán captain)
export const createTeam = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { name, tournamentId, sportType, logo } = req.body;
        const userId = req.user.id;

        if (!name || !tournamentId) {
            return res.status(400).json({ success: false, message: 'Thiếu tên đội hoặc tournamentId' });
        }

        const tournament = await Tournament.findById(tournamentId).session(session);
        if (!tournament) throw new Error('Giải đấu không tồn tại');
        if (!['draft', 'upcoming'].includes(tournament.status)) {
            throw new Error('Giải đấu đã bắt đầu, không thể tạo đội mới');
        }

        const existing = await Team.findOne({ name, tournamentId }).session(session);
        if (existing) throw new Error('Tên đội đã tồn tại trong giải đấu này');

        const [newTeam] = await Team.create([{
            name,
            tournamentId,
            sportType: sportType || tournament.sport,
            ownerId: userId,
            logo: logo || '',
            isPaid: false,
            status: 'Active'
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
        const { name, logo, sportType, status } = req.body;
        const userId = req.user.id;

        const hasPerm = await checkCaptainOrCreator(id, userId);
        if (!hasPerm) return res.status(403).json({ success: false, message: 'Chỉ đội trưởng hoặc chủ đội mới được cập nhật' });

        const team = await Team.findById(id);
        if (!team) return res.status(404).json({ success: false, message: 'Đội không tồn tại' });

        if (name) team.name = name;
        if (logo !== undefined) team.logo = logo;
        if (sportType) team.sportType = sportType;
        if (status) team.status = status;

        await team.save();
        return res.status(200).json({ success: true, message: 'Cập nhật thành công', data: team });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Xóa đội 
export const deleteTeam = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Tìm team
        const team = await Team.findById(id);
        if (!team) {
            return res.status(404).json({ 
                success: false, 
                message: 'Đội không tồn tại' 
            });
        }
        
  
        
        // Xóa team trực tiếp (hard delete)
        await Team.findByIdAndDelete(id);
        
        // Xóa tất cả members của team
        await Member.deleteMany({ teamId: id });
        
  
        
        return res.status(200).json({ 
            success: true, 
            message: 'Đã xóa đội thành công',
            data: { teamId: id, teamName: team.name }
        });
        
    } catch (error) {
        console.error(' Error in deleteTeam:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message,
            stack: error.stack 
        });
    }
};
// ======================== MEMBER MANAGEMENT ========================
// 4. Lấy danh sách đội mà user đang tham gia (Active)
export const getUserTeams = async (req, res) => {
    try {
        const userId = req.user.id;
        const members = await Member.find({ userId, status: 'Active' }).populate('teamId').lean();
        const teams = members.map(m => m.teamId).filter(t => t && t.status === 'Active');
        return res.status(200).json({ success: true, data: teams });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 5. Chi tiết đội (kèm members, phân quyền hiển thị)
export const getTeamDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const team = await Team.findById(id).populate('tournamentId', 'name sport');
        if (!team) return res.status(404).json({ success: false, message: 'Đội không tồn tại' });

        const userId = req.user.id;
        const isCaptainOrCreator = await checkCaptainOrCreator(id, userId);
        const memberFilter = isCaptainOrCreator ? {} : { status: 'Active' };
        const members = await Member.find({ teamId: id, ...memberFilter })
            .populate('userId', 'name email avatar')
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

        // SỬA: Bỏ .populate('ownerId') vì không có field này
        const teams = await Team.find(filter).lean();
        
        const teamsWithCount = await Promise.all(teams.map(async (team) => ({
            ...team,
            memberCount: await Member.countDocuments({ teamId: team._id, status: 'Active' })
        })));
        
        return res.status(200).json({ success: true, data: teamsWithCount });
    } catch (error) {
        console.error("Error in getTeamsByTournament:", error);
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
        if (!newCaptain) throw new Error('Thành viên mới không tồn tại hoặc chưa Active');

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
        if (!invitation || invitation.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Lời mời không hợp lệ' });
        }
        if (invitation.receiverId.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền chấp nhận lời mời này' });
        }

        const member = await Member.findOne({ teamId: invitation.teamId, userId }).session(session);
        if (!member || member.status !== 'Invited') {
            return res.status(400).json({ success: false, message: 'Không tìm thấy thành viên tương ứng' });
        }

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
        if (!invitation || invitation.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Lời mời không hợp lệ' });
        }
        if (invitation.receiverId.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền từ chối' });
        }

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
            .populate('senderId', 'name email')
            .populate('teamId', 'name sportType')
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
        if (!team || team.status !== 'Active') throw new Error('Đội không hợp lệ');

        const existing = await Member.findOne({ teamId, userId }).session(session);
        if (existing && existing.status === 'Active') throw new Error('Bạn đã là thành viên');
        if (existing && existing.status === 'Requested') throw new Error('Yêu cầu của bạn đang chờ duyệt');

        await checkTeamLimit(teamId, session);

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
            .populate('senderId', 'name email avatar')
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
        
        const team = await Team.findById(id);
        if (!team) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đội' });
        }
        
        team.isPaid = isPaid;
        if (isPaid) {
            team.paidAt = new Date();
            team.status = 'confirmed';
        } else {
            team.paidAt = null;
            team.status = 'pending';
        }
        
        await team.save();
        
        res.json({ success: true, data: team });
    } catch (error) {
        console.error("Error in updatePaymentStatus:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const searchUsers = async (req, res) => {
    try {
        const { keyword } = req.query;
        if (!keyword || keyword.trim() === '') {
            return res.status(200).json({ success: true, data: [] });
        }

        const users = await User.find({
            role: 'player',
            $or: [
                { name: { $regex: keyword, $options: 'i' } },
                { email: { $regex: keyword, $options: 'i' } },
                { phoneNumber: { $regex: keyword, $options: 'i' } }
            ]
        }).select('name email phoneNumber avatar skillLevel');

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
        const { tournamentId, sport, categoryId, regMode, name, invitedUserIds } = req.body;
        const userId = req.user.id;

        const tournament = await Tournament.findById(tournamentId).session(session);
        if (!tournament) throw new Error('Giải đấu không tồn tại');
        if (tournament.status !== 'upcoming') throw new Error('Giải đấu đã bắt đầu hoặc kết thúc, không thể đăng ký');

        const sportConfig = tournament.sportsConfig?.find(s => s.sport === sport);
        if (!sportConfig) throw new Error(`Môn thể thao ${sport} không có trong giải đấu`);

        let newTeam;
        let fee = sportConfig.feeEntry || 0;

        if (regMode === 'solo') {
            const soloTeamName = `${req.user.name || 'VĐV'} - ${sport} ${categoryId || ''}`;
            [newTeam] = await Team.create([{
                name: soloTeamName,
                tournamentId,
                sportType: sport,
                ownerId: userId,
                status: 'Active',
                isPaid: false
            }], { session });
        }
        else if (regMode === 'create') {
            if (!name) throw new Error('Tên đội không được để trống');
            [newTeam] = await Team.create([{
                name,
                tournamentId,
                sportType: sport,
                ownerId: userId,
                status: 'Active',
                isPaid: false
            }], { session });
        }
        else if (regMode === 'random') {
            [newTeam] = await Team.create([{
                name: `Random_${Date.now()}_${userId.slice(-4)}`,
                tournamentId,
                sportType: sport,
                ownerId: userId,
                status: 'pending',
                isPaid: false
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
            status: 'Active',
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
            name: newTeam.name,
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

export const mergeTeam = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { baseRuleId } = req.params;
        const baseRule = await BaseRule.findById(baseRuleId).populate('tournamentStructure.categories').session(session);
        if (!baseRule) throw new Error('BaseRule not found');
        const tournamentId = baseRule.tournamentId;
        const sportType = baseRule.sport;
        const categoryRule = baseRule.tournamentStructure.categories[0];
        if (!categoryRule?.categories.length) throw new Error('No categories');

        const allMergedTeams = [];

        for (const category of categoryRule.categories) {
            const categoryId = category.id;
            const requiredPlayers = category.minPlayers;

            const teams = await Team.find({
                tournamentId,
                sportType: sportType,
                status: { $in: ['pending', 'confirmed'] }
            }).session(session);

            const incompleteTeams = [];
            for (const team of teams) {
                const memberCount = await Member.countDocuments({ teamId: team._id, status: 'Active' }).session(session);
                if (memberCount < requiredPlayers) {
                    incompleteTeams.push({ team, memberCount, needed: requiredPlayers - memberCount });
                }
            }

            if (incompleteTeams.length < 2) continue;

            for (let i = incompleteTeams.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [incompleteTeams[i], incompleteTeams[j]] = [incompleteTeams[j], incompleteTeams[i]];
            }

            let i = 0;
            while (i < incompleteTeams.length - 1) {
                const teamA = incompleteTeams[i].team;
                const teamB = incompleteTeams[i + 1].team;
                const totalMembers = incompleteTeams[i].memberCount + incompleteTeams[i + 1].memberCount;
                if (totalMembers <= requiredPlayers) {
                    const membersOfB = await Member.find({ teamId: teamB._id, status: 'Active' }).session(session);
                    for (const member of membersOfB) {
                        member.teamId = teamA._id;
                        member.joinedAt = new Date();
                        await member.save({ session });
                    }
                    await Team.findByIdAndDelete(teamB._id).session(session);
                    const newCount = await Member.countDocuments({ teamId: teamA._id, status: 'Active' }).session(session);
                    if (newCount === requiredPlayers) {
                        teamA.status = 'confirmed';
                        await teamA.save({ session });
                    }
                    allMergedTeams.push({ team: teamA, fromTeams: [teamA._id, teamB._id] });
                } else {
                    const needFromB = requiredPlayers - incompleteTeams[i].memberCount;
                    if (needFromB > 0) {
                        const membersOfB = await Member.find({ teamId: teamB._id, status: 'Active' }).session(session).limit(needFromB);
                        for (const member of membersOfB) {
                            member.teamId = teamA._id;
                            member.joinedAt = new Date();
                            await member.save({ session });
                        }
                        const remaining = await Member.countDocuments({ teamId: teamB._id, status: 'Active' }).session(session);
                        if (remaining === 0) {
                            await Team.findByIdAndDelete(teamB._id).session(session);
                        }
                        const newCount = await Member.countDocuments({ teamId: teamA._id, status: 'Active' }).session(session);
                        if (newCount === requiredPlayers) {
                            teamA.status = 'confirmed';
                            await teamA.save({ session });
                        }
                        allMergedTeams.push({ team: teamA, fromTeams: [teamA._id, teamB._id] });
                    }
                }
                i += 2;
            }
        }

        await session.commitTransaction();
        return res.status(200).json({ success: true, data: allMergedTeams });
    } catch (error) {
        await session.abortTransaction();
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// 19. Cập nhật trạng thái nhà tài trợ
export const updateSponsorStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isSponsor } = req.body;
        let { isPaid } = req.body;
        const userId = req.user.id;
        
        // Kiểm tra quyền
        const user = await User.findById(userId);
        const isAuthorized = user && ( user.role === 'org' || user.role === 'Organization');
        
        if (!isAuthorized) {
            return res.status(403).json({ 
                success: false, 
                message: 'Chỉ tổ chức mới được cập nhật trạng thái nhà tài trợ' 
            });
        }
        
        const team = await Team.findById(id);
        if (!team) {
            return res.status(404).json({ 
                success: false, 
                message: 'Không tìm thấy đội' 
            });
        }
        
        team.isSponsor = isSponsor;
        
        
        if (isSponsor) {
            isPaid = false;
            team.status = 'confirmed';
        } else {
            isPaid = false;
            team.status = 'pending';
        }
        
        await team.save();
        
        
        res.json({ 
            success: true, 
            data: team,
            message: isSponsor ? 'Đã duyệt nhà tài trợ' : 'Đã hủy duyệt nhà tài trợ'
        });
    } catch (error) {
        console.error("Error in updateSponsorStatus:", error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};