import Group from '../models/groups.js';
import { sortStandings } from '../utils/standingsHelper.js';
import { assignTeamsToGroups } from '../utils/groupAssignerHelper.js';

export const sortRankingInGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const group = await Group.findById(groupId).populate('standings.teamId', 'name');
        if (!group) return res.status(404).json({ success: false, message: 'Group không tồn tại' });

        const sorted = sortStandings(group.standings);


        return res.status(200).json({ success: true, data: sorted });
    } catch (error) {
        console.error('sortRankingInGroup error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const addTeamToGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { teamId } = req.body;
        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ success: false, message: 'Group không tồn tại' });

        // Thêm team vào group
        group.teamInGroup.push(teamId);
        await group.save();

        return res.status(200).json({ success: true, message: 'Team added to group successfully' });
    } catch (error) {
        console.error('addTeamToGroup error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateGroupStatus = async (req, res) => {
    try {
        const { groupId } = req.params;
        const group = await Group.findById(groupId);
        if (!group) 
            {
                return res.status(404).json({ success: false, message: 'Group không tồn tại' });        
            }
        if(group.teamInGroup.length === 0) 
            {
                return res.status(400).json({ success: false, message: 'Không thể cập nhật trạng thái cho group chưa có đội nào' });
            }
        

        await group.save();
    } catch (error) {
        console.error('updateGroupStatus error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const assignExistingTeamsToGroups = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { tournamentId, sportType, method = 'random' } = req.body;
        // Lấy tất cả team active của giải
        const teams = await Team.find({ tournamentId, sportType, status: 'active' }).select('_id');
        const teamIds = teams.map(t => t._id);
        if (!teamIds.length) {
            return res.status(400).json({ success: false, message: 'Không có team nào' });
        }

        // Lấy danh sách group của giải (đã tạo rỗng)
        const groups = await Group.find({ tournamentId, sport: sportType }).sort({ name: 1 });
        if (!groups.length) {
            return res.status(400).json({ success: false, message: 'Chưa có group nào, hãy tạo group trước' });
        }

        // Phân bố team vào groups
        const assignedGroups = await assignTeamsToGroups(teamIds, groups.length, method);

        // Cập nhật từng group
        for (let i = 0; i < groups.length; i++) {
            const group = groups[i];
            const teamIdsForGroup = assignedGroups[i];
            group.teamInGroup = teamIdsForGroup;
            // Tạo lại standings array cho group (nếu cần)
            group.standings = teamIdsForGroup.map(teamId => ({
                teamId,
                played: 0, wins: 0, draws: 0, losses: 0,
                goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0
            }));
            await group.save({ session });
            // Cập nhật trường group cho từng team
            await Team.updateMany({ _id: { $in: teamIdsForGroup } }, { group: group.name }, { session });
        }

        await session.commitTransaction();
        res.json({ success: true, message: 'Phân bố team vào bảng thành công' });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};
