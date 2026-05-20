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

/**
 * Khởi tạo giải đấu: Tạo bảng → Phân đội → Xếp lịch
 */
export const initializeTournament = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { tournamentId } = req.params;
        const { stageRuleId, startTime, courts = [], method = 'random' } = req.body;

        // ===== 1. Lấy StageRule =====
        const stageRule = await StageRule.findById(stageRuleId).lean();
        if (!stageRule) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy cấu hình vòng đấu' });
        }

        const sportType = stageRule.sportType;

        // ===== 2. Tạo Bracket =====
        let bracket = await Bracket.findOne({ tournamentId, sport: sportType }).session(session);
        if (bracket) {
            // Xóa groups cũ và matches cũ
            const oldGroups = await Group.find({ bracketId: bracket._id }).session(session);
            for (const g of oldGroups) {
                await Match.deleteMany({ groupId: g._id }).session(session);
            }
            await Group.deleteMany({ bracketId: bracket._id }).session(session);
        } else {
            bracket = await Bracket.create([{
                tournamentId,
                stageId: stageRuleId,
                sport: sportType,
                name: `${sportType} - ${stageRule.stageName}`,
                numberOfGroup: 0,
                groups: []
            }], { session });
            bracket = bracket[0];
        }

        // ===== 3. Tạo Groups từ StageRule =====
        const groupData = [];
        if (stageRule.type === 'GROUP_STAGE' && stageRule.branches) {
            for (const branch of stageRule.branches) {
                for (let i = 0; i < branch.numberOfGroups; i++) {
                    groupData.push({
                        name: `${branch.name} - Bảng ${i + 1}`,
                        bracketId: bracket._id,
                        sport: sportType,
                        stageRuleId: stageRuleId,
                        tournamentId,
                        teamInGroup: [],
                        standings: [],
                        status: 'pending'
                    });
                }
            }
        } else {
            // Mặc định 1 bảng
            groupData.push({
                name: 'Bảng 1',
                bracketId: bracket._id,
                sport: sportType,
                stageRuleId: stageRuleId,
                tournamentId,
                teamInGroup: [],
                standings: [],
                status: 'pending'
            });
        }

        const groups = await Group.insertMany(groupData, { session });
        console.log(`✅ Đã tạo ${groups.length} bảng`);

        // ===== 4. Lấy Teams =====
        const teams = await Team.find({
            tournamentId,
            sportCategory: sportType,
            status: { $in: ['validated', 'confirmed', 'pending', 'active'] }
        }).lean();

        console.log(`✅ Tìm thấy ${teams.length} đội`);

        if (teams.length < 2) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: `Cần ít nhất 2 đội, hiện có ${teams.length} đội`
            });
        }

        // ===== 5. Phân đội vào bảng =====
        const teamIds = teams.map(t => t._id);
        const assignedGroups = await assignTeamsToGroups(teamIds, groups.length, method);

        for (let i = 0; i < groups.length; i++) {
            const assignedTeamIds = assignedGroups[i] || [];
            await Group.findByIdAndUpdate(groups[i]._id, {
                teamInGroup: assignedTeamIds,
                standings: assignedTeamIds.map(teamId => ({
                    teamId,
                    played: 0, wins: 0, draws: 0, losses: 0,
                    goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0
                }))
            }).session(session);

            await Team.updateMany(
                { _id: { $in: assignedTeamIds } },
                { group: groups[i].name }
            ).session(session);
        }

        console.log(`✅ Đã phân ${teams.length} đội vào ${groups.length} bảng`);

        // ===== 6. Tạo lịch đấu =====
        let allMatches = [];
        let matchNumber = 1;
        const start = new Date(startTime);

        for (let i = 0; i < groups.length; i++) {
            const groupTeams = assignedGroups[i] || [];
            if (groupTeams.length < 2) continue;

            const groupMatches = createRoundRobinMatches(
                groupTeams,
                groups[i]._id,
                tournamentId,
                bracket._id,
                stageRuleId,
                sportType,
                stageRuleId
            );

            groupMatches.forEach((match, idx) => {
                match.matchNumber = matchNumber++;
                match.scheduledStartTime = new Date(start.getTime() + (matchNumber - 1) * 60 * 60 * 1000);
                match.courtName = courts[(matchNumber - 1) % courts.length] || 'Sân 1';
            });

            allMatches = allMatches.concat(groupMatches);
        }

        if (allMatches.length > 0) {
            await Match.insertMany(allMatches, { session });
            console.log(`✅ Đã tạo ${allMatches.length} trận đấu`);
        }

        // Cập nhật bracket
        await Bracket.findByIdAndUpdate(bracket._id, {
            numberOfGroup: groups.length,
            groups: groups.map(g => g._id)
        }).session(session);

        await session.commitTransaction();

        res.status(201).json({
            success: true,
            data: {
                groups: groups.length,
                teams: teams.length,
                matches: allMatches.length,
                matchList: allMatches
            },
            message: `✅ Thành công! ${groups.length} bảng, ${teams.length} đội, ${allMatches.length} trận đấu`
        });

    } catch (error) {
        await session.abortTransaction();
        console.error('❌ initializeTournament error:', error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};