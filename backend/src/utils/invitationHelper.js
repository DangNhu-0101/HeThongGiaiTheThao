import Invitation from '../models/invitations.js';
import User from '../models/users.js';
import Member from '../models/membersOfTeam.js';

/**
 * Tạo lời mời và upsert member (dùng cho captain mời)
 * @param {ObjectId} senderId - Người gửi (captain/creator)
 * @param {ObjectId} receiverId - Người được mời
 * @param {ObjectId} teamId - Đội bóng
 * @param {string} invitationType - 'captain_invite' (mặc định) hoặc 'player_request'
 * @param {ClientSession} session - Mongoose session (tùy chọn)
 * @returns {Promise<Object>} invitation document
 */
export const handleCreateInvitation = async (senderId, receiverId, teamId, invitationType = 'captain_invite', session = null) => {
    // Kiểm tra receiver tồn tại
    const userB = await User.findById(receiverId).session(session);
    if (!userB) throw new Error('Người dùng nhận lời mời không tồn tại');


    if (invitationType === 'captain_invite' && userB.role !== 'player') {
        throw new Error('Người dùng này không phải là Cầu thủ, không thể mời vào đội.');
    }

    // Kiểm tra thành viên active hoặc pending?
    const existingMember = await Member.findOne({ teamId, userId: receiverId }).session(session);
    if (existingMember && existingMember.status === 'active') {
        throw new Error('Người dùng đã là thành viên chính thức của đội.');
    }
    // Kiểm tra lời mời pending cùng loại (tránh trùng)
    const existingInvite = await Invitation.findOne({
        receiverId, teamId, status: 'pending', invitationType
    }).session(session);
    if (existingInvite) throw new Error('Lời mời đã được gửi trước đó và đang chờ phản hồi.');

    // Tạo lời mời mới
    const [newInvitation] = await Invitation.create([{
        senderId, receiverId, teamId, status: 'pending', invitationType
    }], { session });

    // Upsert member với status phù hợp
    let memberStatus = '';
    if (invitationType === 'captain_invite') memberStatus = 'Invited';
    else if (invitationType === 'player_request') memberStatus = 'Requested';
    else memberStatus = 'Invited';

    await Member.findOneAndUpdate(
        { teamId, userId: receiverId },
        { status: memberStatus, role: 'Member', $setOnInsert: { joinedAt: null } },
        { upsert: true, session }
    );

    return newInvitation;
};

export default handleCreateInvitation;