import mongoose from 'mongoose';
import StageRule from '../models/rules/stageRules.js';
import Group from '../models/groups.js';
import Team from '../models/teams.js';
import Match from '../models/matches.js';
import { 
    createGroupsFromStageRule, 
    getQualifiedTeamsFromGroupStage,
    createAllKnockoutMatches 
} from '../utils/stageHelper.js';
import { assignTeamsToGroups } from '../utils/groupAssignerHelper.js';
import { createRoundRobinMatches } from '../utils/matchScheduleHelper.js';
import { updateStandingsAfterMatch } from '../utils/standingHelper.js';

/**
 * BƯỚC 1: Khởi tạo cấu trúc giải đấu từ StageRule
 * - Tạo Bracket
 * - Tạo Groups
 * - Phân đội vào Groups
 * - Tạo lịch vòng bảng
 */
export const initializeTournamentFromStageRule = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { tournamentId } = req.params;
        const { stageRuleId, method = 'random', startTime, courts = [] } = req.body;

        // 1. Lấy StageRule
        const stageRule = await StageRule.findById(stageRuleId).lean();
        if (!stageRule) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy cấu hình vòng đấu' });
        }

        // 2. Tạo Groups từ cấu hình
        const groups = await createGroupsFromStageRule(stageRule, tournamentId);
        
        // 3. Lấy danh sách teams
        const teams = await Team.find({ 
            tournamentId, 
            sportCategory: stageRule.sportType,
            status: { $in: ['validated', 'confirmed', 'active'] } 
        }).lean();
        
        if (teams.length < 2) {
            return res.status(400).json({ success: false, message: 'Cần ít nhất 2 đội' });
        }

        // 4. Phân đội vào bảng
        const teamIds = teams.map(t => t._id);
        const assignedGroups = await assignTeamsToGroups(teamIds, groups.length, method);

        // 5. Cập nhật groups với teams và standings
        const updatedGroups = [];
        for (let i = 0; i < groups.length; i++) {
            const group = groups[i];
            const assignedTeamIds = assignedGroups[i] || [];
            
            group.teamInGroup = assignedTeamIds;
            group.standings = assignedTeamIds.map(teamId => ({
                teamId,
                played: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                goalDifference: 0,
                points: 0
            }));
            
            await Group.findByIdAndUpdate(group._id, {
                teamInGroup: group.teamInGroup,
                standings: group.standings,
                status: 'pending'
            }).session(session);

            // Cập nhật team.group
            await Team.updateMany(
                { _id: { $in: assignedTeamIds } },
                { group: group.name }
            ).session(session);

            updatedGroups.push(group);
        }

        // 6. Tạo lịch vòng bảng
        let allMatches = [];
        let matchNumber = 1;

        for (const group of updatedGroups) {
            if (group.teamInGroup.length < 2) continue;
            
            const groupMatches = createRoundRobinMatches(
                group.teamInGroup,
                group._id,
                tournamentId,
                group.bracketId,
                group.stageRuleId,
                group.sport,
                stageRuleId
            );

            // Gán thời gian và sân nếu có
            if (startTime) {
                groupMatches.forEach((match, idx) => {
                    match.matchNumber = matchNumber++;
                    match.scheduledStartTime = new Date(
                        new Date(startTime).getTime() + (idx) * 60 * 60 * 1000
                    );
                    match.courtName = courts[idx % courts.length] || 'Sân 1';
                });
            }

            allMatches = allMatches.concat(groupMatches);
        }

        if (allMatches.length > 0) {
            await Match.insertMany(allMatches, { session });
        }

        await session.commitTransaction();

        res.status(201).json({
            success: true,
            message: 'Khởi tạo giải đấu thành công',
            data: {
                groups: updatedGroups.length,
                matches: allMatches.length,
                totalTeams: teams.length
            }
        });

    } catch (error) {
        await session.abortTransaction();
        console.error('initializeTournamentFromStageRule error:', error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

/**
 * BƯỚC 2: Kết thúc vòng bảng & tạo lịch knock-out
 * - Đọc standings từ các group
 * - Chọn đội đi tiếp theo cấu hình
 * - Tạo lịch knock-out từ substages
 */
export const advanceToKnockoutStage = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { tournamentId } = req.params;
        const { stageRuleId, startTime, courts = [] } = req.body;

        // 1. Lấy StageRule
        const stageRule = await StageRule.findById(stageRuleId).lean();
        if (!stageRule) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy cấu hình' });
        }

        // 2. Lấy tất cả groups đã hoàn thành vòng bảng
        const groups = await Group.find({
            tournamentId,
            stageRuleId: stageRule._id,
            sport: stageRule.sportType
        }).lean();

        if (!groups.length) {
            return res.status(400).json({ success: false, message: 'Không có bảng đấu nào' });
        }

        // 3. Chọn đội đi tiếp
        const qualifiedTeams = getQualifiedTeamsFromGroupStage(stageRule, groups);

        // 4. Tạo lịch knock-out từ substages
        const options = {
            tournamentId,
            bracketId: groups[0].bracketId,
            sportType: stageRule.sportType,
            ruleId: stageRuleId,
            stageRuleId: stageRule._id,
            startTime,
            courts
        };

        const knockoutMatches = createAllKnockoutMatches(
            stageRule.substages || [],
            qualifiedTeams,
            options
        );

        // 5. Lưu matches knock-out
        if (knockoutMatches.length > 0) {
            await Match.insertMany(knockoutMatches, { session });
        }

        // 6. Cập nhật trạng thái groups thành completed
        await Group.updateMany(
            { _id: { $in: groups.map(g => g._id) } },
            { status: 'completed' }
        ).session(session);

        await session.commitTransaction();

        res.status(200).json({
            success: true,
            message: 'Đã tạo lịch knock-out',
            data: {
                qualifiedTeams,
                knockoutMatches: knockoutMatches.length,
                rounds: [...new Set(knockoutMatches.map(m => m.round))]
            }
        });

    } catch (error) {
        await session.abortTransaction();
        console.error('advanceToKnockoutStage error:', error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

/**
 * Lấy thông tin các đội đã qualified (để xem trước khi tạo lịch)
 */
export const previewQualifiedTeams = async (req, res) => {
    try {
        const { tournamentId } = req.params;
        const { stageRuleId } = req.query;

        const stageRule = await StageRule.findById(stageRuleId).lean();
        if (!stageRule) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy cấu hình' });
        }

        const groups = await Group.find({
            tournamentId,
            stageRuleId: stageRule._id,
            sport: stageRule.sportType
        }).populate('standings.teamId', 'name').lean();

        const qualifiedTeams = getQualifiedTeamsFromGroupStage(stageRule, groups);

        res.json({ success: true, data: { qualifiedTeams, stageRule, groups } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};