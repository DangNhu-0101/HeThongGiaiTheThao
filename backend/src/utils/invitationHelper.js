import Invitation from '../models/Invitations.js';
import User from '../models/users.js';
import Member from '../models/membersOfTeam.js';


export const handleCreateInvitation = async (senderId, receiverId, teamId, invitationType = 'captain_invite', session = null) => {
    // Kiểm tra receiver tồn tại
    const userB = await User.findById(receiverId).session(session);
    if (!userB) throw new Error('Người dùng nhận lời mời không tồn tại');


    if (invitationType === 'captain_invite' && userB.role !== 'Player') {
        throw new Error('Người dùng này không phải là Cầu thủ, không thể mời vào đội.');
    }

    // Kiểm tra thành viên active hoặc pending?
    const existingMember = await Member.findOne({ teamId, userId: receiverId }).session(session);
    if (existingMember && existingMember.status === 'Active') {
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