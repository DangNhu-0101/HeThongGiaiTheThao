import Invitation from '../models/Invitations.js';
import User from '../models/User.js';
import Member from '../models/members.js'; // Import thêm Model Member mới của ní

export const handleCreateInvitation = async (senderId, receiverId, teamId) => {
    try {
        // 1. Kiểm tra User nhận có tồn tại không
        const userB = await User.findById(receiverId);
        if (!userB) {
            throw new Error("Người dùng nhận lời mời không tồn tại trên hệ thống");
        }

        // 2. Kiểm tra Role (Tùy mục đích, ở đây giữ nguyên là chỉ mời Player)
        if (userB.role !== 'Player') {
            throw new Error("Người dùng này không phải là Cầu thủ, không thể mời vào đội.");
        }

        // 3. Kiểm tra xem người này đã THỰC SỰ có trong đội chưa (tránh mời người đã là thành viên)
        const isAlreadyMember = await Member.findOne({
            teamId,
            userId: receiverId,
            status: 'Active'
        });
        if (isAlreadyMember) {
            throw new Error("Người dùng này đã là thành viên chính thức của đội rồi.");
        }

        // 4. Kiểm tra lời mời đang chờ (pending)
        const exist = await Invitation.findOne({
            receiverId,
            teamId,
            status: 'pending'
        });
        if (exist) {
            throw new Error("Lời mời đã được gửi trước đó và đang chờ phản hồi.");
        }

        // 5. TẠO LỜI MỜI (Invitation)
        const newInvitation = await Invitation.create({
            senderId,
            receiverId,
            teamId,
            status: 'pending'
        });return await newInvitation.save();

        // 6. TẠO BẢN GHI THÀNH VIÊN (Member) ở trạng thái 'Invited'
        // Việc này giúp ní hiện danh sách "Cầu thủ đang mời" trong quản lý đội
        await Member.findOneAndUpdate(
            { teamId, userId: receiverId }, // Điều kiện
            {
                status: 'Invited',
                role: 'Member'
            }, // Dữ liệu update/create
            { upsert: true, new: true } // Nếu chưa có thì tạo mới (upsert)
        );

        return newInvitation;

    } catch (error) {
        throw error;
    }
};

export default handleCreateInvitation;