import mongoose from 'mongoose';
import Tournament from '../models/tournaments.js';
import BaseRule from '../models/rules/baseRules.js';
import StageRule from '../models/rules/stageRules.js';
import Bracket from '../models/rules/brackets.js';
import Group from '../models/groups.js';
import Team from '../models/teams.js';
import Match from '../models/matches.js';
import {
    getQualifiedTeamsFromGroupStage,
    createAllKnockoutMatches
} from '../utils/stageHelper.js';
import { assignTeamsToGroups } from '../utils/groupAssignerHelper.js';
import { createRoundRobinMatches } from '../utils/matchScheduleHelper.js';

const TEAM_STATUSES = ['pending', 'validated', 'confirmed', 'playing', 'Active'];

const getId = (value) => value?._id || value || null;

const getTeamDisplayName = (team) => team?.name || team?.teamName || 'Đội chưa đặt tên';

const resolveRuleContext = async ({ tournamentId, ruleId, baseRuleId, stageRuleId }, session) => {
    let baseRule = null;
    let stageRule = null;

    const requestedBaseRuleId = ruleId || baseRuleId;
    if (requestedBaseRuleId) {
        baseRule = await BaseRule.findById(requestedBaseRuleId)
            .populate('tournamentStructure.stages')
            .session(session)
            .lean();
    }

    if (stageRuleId) {
        stageRule = await StageRule.findById(stageRuleId).session(session).lean();
        if (!baseRule) {
            baseRule = await BaseRule.findOne({
                tournamentId,
                'tournamentStructure.stages': stageRuleId
            }).session(session).lean();
        }
    }

    if (!baseRule && !stageRule) {
        const tournament = await Tournament.findById(tournamentId).session(session).lean();
        const tournamentBaseRuleId = getId(tournament?.baseRule?.[0]);
        if (tournamentBaseRuleId) {
            baseRule = await BaseRule.findById(tournamentBaseRuleId)
                .populate('tournamentStructure.stages')
                .session(session)
                .lean();
        }
    }

    if (baseRule && !stageRule) {
        const populatedStage = baseRule.tournamentStructure?.stages?.[0];
        const resolvedStageRuleId = getId(populatedStage);
        stageRule = populatedStage?.stageName
            ? populatedStage
            : await StageRule.findById(resolvedStageRuleId).session(session).lean();
    }

    if (!stageRule) {
        stageRule = await StageRule.findOne({ tournamentId }).sort({ createdAt: -1 }).session(session).lean();
    }

    if (!stageRule) {
        throw new Error('Không tìm thấy cấu hình vòng đấu. Hãy tạo StageRule cho giải đấu trước.');
    }

    if (!baseRule) {
        baseRule = await BaseRule.findOne({
            tournamentId,
            $or: [
                { 'tournamentStructure.stages': stageRule._id },
                { sport: stageRule.sportType },
                { sportType: stageRule.sportType }
            ]
        }).session(session).lean();
    }

    return { baseRule, stageRule };
};

const normalizeStageRule = (stageRule) => {
    const groupStage = stageRule.stages?.find((stage) => stage.type === 'GROUP_STAGE')
        || stageRule.stages?.[0]
        || stageRule;

    return {
        ...stageRule,
        ...groupStage,
        _id: stageRule._id,
        sportType: stageRule.sportType || groupStage.sportType || groupStage.sport,
        substages: stageRule.substages?.length ? stageRule.substages : groupStage.substages || []
    };
};

const buildGroupSeeds = (stageConfig, tournamentId, bracketId) => {
    const groups = [];
    const sportType = stageConfig.sportType || stageConfig.sport || 'Other';

    if (stageConfig.hasBranches && stageConfig.branches?.length) {
        for (const branch of stageConfig.branches) {
            const numberOfGroups = Number(branch.numberOfGroups || 1);
            for (let index = 0; index < numberOfGroups; index += 1) {
                groups.push({
                    name: `${branch.name || 'Nhánh chính'} - Bảng ${index + 1}`,
                    tournamentId,
                    bracketId,
                    sport: sportType,
                    stageRuleId: stageConfig._id,
                    teamInGroup: [],
                    standings: [],
                    status: 'pending'
                });
            }
        }
    } else {
        const numberOfGroups = Number(stageConfig.numberOfGroups || stageConfig.branches?.[0]?.numberOfGroups || 1);
        for (let index = 0; index < numberOfGroups; index += 1) {
            groups.push({
                name: `Bảng ${String.fromCharCode(65 + index)}`,
                tournamentId,
                bracketId,
                sport: sportType,
                stageRuleId: stageConfig._id,
                teamInGroup: [],
                standings: [],
                status: 'pending'
            });
        }
    }

    return groups;
};

const findTeamsForSport = async (tournamentId, sportType, session) => {
    const filter = {
        tournamentId,
        status: { $in: TEAM_STATUSES }
    };

    const sportTeams = await Team.find({ ...filter, sportCategory: sportType }).session(session).lean();
    if (sportTeams.length) return sportTeams;

    return Team.find(filter).session(session).lean();
};

const toClientMatch = (match, teamMap) => {
    const team1Id = match.team1?.toString?.() || match.team1;
    const team2Id = match.team2?.toString?.() || match.team2;

    return {
        _id: match._id,
        matchNumber: match.matchNumber,
        round: match.round,
        teamA: teamMap.get(team1Id) || null,
        teamB: teamMap.get(team2Id) || null,
        scheduledStartTime: match.scheduledStartTime,
        courtName: match.courtName,
        status: match.status,
        scoreA: match.team1Score,
        scoreB: match.team2Score
    };
};

const buildClientGroups = async (groups, matches, session) => {
    const allTeamIds = [
        ...groups.flatMap((group) => group.teamInGroup || []),
        ...matches.flatMap((match) => [match.team1, match.team2].filter(Boolean))
    ];
    let teamQuery = Team.find({ _id: { $in: allTeamIds } });
    if (session) teamQuery = teamQuery.session(session);
    const teams = await teamQuery.lean();
    const teamMap = new Map(teams.map((team) => [team._id.toString(), {
        _id: team._id,
        name: getTeamDisplayName(team),
        logo: team.logo
    }]));

    return groups.map((group) => ({
        _id: group._id,
        name: group.name,
        teams: (group.teamInGroup || []).map((teamId) => teamMap.get(teamId.toString())).filter(Boolean),
        standings: group.standings || [],
        matches: matches
            .filter((match) => match.groupId?.toString() === group._id.toString())
            .map((match) => toClientMatch(match, teamMap))
    }));
};

export const initializeTournamentFromStageRule = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { tournamentId } = req.params;
        const { stageRuleId, ruleId, baseRuleId, method = 'random', startTime, courts = [], matchDuration } = req.body;

        const { baseRule, stageRule } = await resolveRuleContext({
            tournamentId,
            ruleId,
            baseRuleId,
            stageRuleId
        }, session);
        const stageConfig = normalizeStageRule(stageRule);
        const sportType = stageConfig.sportType || baseRule?.sport || baseRule?.sportType || 'Other';
        const ruleObjectId = baseRule?._id || stageRule._id;
        const tournament = await Tournament.findById(tournamentId).session(session).lean();
        const scheduleStart = new Date(startTime || tournament?.timeLine?.tournamentStart || Date.now());
        const courtList = courts.length ? courts : ['Sân 1'];
        const matchDurationMinutes = Number(matchDuration || stageConfig.matchDuration || 60);

        const existingBrackets = await Bracket.find({ tournamentId, sport: sportType }).session(session).lean();
        const existingBracketIds = existingBrackets.map((bracket) => bracket._id);
        if (existingBracketIds.length) {
            await Match.deleteMany({ bracketId: { $in: existingBracketIds } }).session(session);
            await Group.deleteMany({ bracketId: { $in: existingBracketIds } }).session(session);
            await Bracket.deleteMany({ _id: { $in: existingBracketIds } }).session(session);
        }

        const [bracket] = await Bracket.create([{
            tournamentId,
            stageId: stageRule._id,
            sport: sportType,
            name: `${sportType} - ${stageConfig.stageName || 'Vòng bảng'}`,
            numberOfGroup: 0,
            groups: [],
            totalTeams: 0,
        }], { session });

        // 1. Tìm danh sách đội tham gia môn thể thao này
        const teams = await findTeamsForSport(tournamentId, sportType, session);
        if (teams.length < 2) {
            throw new Error(`Cần ít nhất 2 đội để khởi tạo giải đấu, hiện chỉ có ${teams.length} đội.`);
        }

        // 2. Tạo cấu trúc các bảng đấu (Seeds) dựa trên cấu hình vòng đấu
        const groupDocs = buildGroupSeeds(stageConfig, tournamentId, bracket._id);
        const groups = await Group.insertMany(groupDocs, { session });

        // 3. Phân bổ các đội vào bảng (mặc định là ngẫu nhiên nếu không chọn seeding)
        const teamIds = teams.map(t => t._id);
        const assignedGroups = await assignTeamsToGroups(teamIds, groups.length, method);

        let allMatches = [];
        let globalMatchCount = 0;

        for (let i = 0; i < groups.length; i++) {
            const groupTeamIds = assignedGroups[i] || [];
            if (groupTeamIds.length < 2) continue;

            // Cập nhật danh sách đội và khởi tạo bảng điểm (standings) cho từng bảng
            await Group.findByIdAndUpdate(groups[i]._id, {
                teamInGroup: groupTeamIds,
                standings: groupTeamIds.map(tid => ({
                    teamId: tid,
                    played: 0, wins: 0, draws: 0, losses: 0,
                    goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0
                }))
            }, { session });

            // Gán tên bảng vào thông tin đội để dễ truy vấn hiển thị
            await Team.updateMany(
                { _id: { $in: groupTeamIds } },
                { group: groups[i].name },
                { session }
            );

            // 4. Tạo lịch thi đấu vòng tròn cho bảng đấu hiện tại
            const groupMatches = createRoundRobinMatches(
                groupTeamIds,
                groups[i]._id,
                tournamentId,
                bracket._id,
                stageRule._id,
                sportType,
                ruleObjectId
            );

            // Tự động sắp xếp thời gian thi đấu và gán sân
            groupMatches.forEach((match) => {
                const matchOffset = globalMatchCount * matchDurationMinutes * 60 * 1000;
                match.scheduledStartTime = new Date(scheduleStart.getTime() + matchOffset);
                match.courtName = courtList[globalMatchCount % courtList.length];
                match.matchNumber = globalMatchCount + 1;
                globalMatchCount++;
            });

            allMatches = allMatches.concat(groupMatches);
        }

        // Lưu tất cả các trận đấu đã tạo vào Database
        if (allMatches.length > 0) {
            await Match.insertMany(allMatches, { session });
        }

        // Cập nhật lại thông tin tổng quát cho Bracket (nhánh đấu)
        await Bracket.findByIdAndUpdate(bracket._id, {
            numberOfGroup: groups.length,
            groups: groups.map(g => g._id),
            totalTeams: teams.length
        }, { session });

        // Hoàn tất giao dịch
        await session.commitTransaction();

        // Lấy dữ liệu đã định dạng lại để phản hồi về phía Frontend
        const clientGroups = await buildClientGroups(groups, allMatches, session);

        return res.status(200).json({
            success: true,
            message: 'Khởi tạo vòng bảng và xếp lịch thi đấu tự động thành công!',
            data: {
                bracketId: bracket._id,
                groups: clientGroups
            }
        });

    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        console.error('initializeTournamentFromStageRule Error:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message || 'Lỗi hệ thống trong quá trình khởi tạo giải đấu tự động' 
        });
    } finally {
        session.endSession();
    }
};

/**
 * Xem trước danh sách các đội đủ điều kiện đi tiếp từ vòng bảng
 */
export const previewQualifiedTeams = async (req, res) => {
    try {
        const { tournamentId } = req.params;
        const { sportType } = req.query;

        const groups = await Group.find({ tournamentId, sport: sportType })
            .populate('teamInGroup', 'name logo')
            .lean();

        if (!groups.length) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin bảng đấu.' });
        }

        // Sử dụng helper để tính toán đội đi tiếp dựa trên BXH hiện tại
        const qualifiedData = await getQualifiedTeamsFromGroupStage(groups);

        return res.status(200).json({
            success: true,
            data: qualifiedData
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Chuyển từ vòng bảng sang vòng Knock-out (Tạo lịch thi đấu loại trực tiếp)
 */
export const advanceToKnockoutStage = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { tournamentId } = req.params;
        const { stageRuleId, startTime, courts = [], matchDuration } = req.body;

        // 1. Lấy thông tin luật thi đấu cho vòng Knock-out
        const { stageRule } = await resolveRuleContext({ tournamentId, stageRuleId }, session);
        const stageConfig = normalizeStageRule(stageRule);
        const sportType = stageConfig.sportType;

        // 2. Lấy danh sách đội đã vượt qua vòng bảng
        const groups = await Group.find({ tournamentId, sport: sportType }).session(session).lean();
        const qualifiedTeams = await getQualifiedTeamsFromGroupStage(groups);

        if (!qualifiedTeams || qualifiedTeams.length < 2) {
            throw new Error('Không đủ đội đủ điều kiện để tạo vòng Knock-out.');
        }

        // 3. Tạo Bracket mới cho vòng Knock-out (nếu chưa có)
        const [knockoutBracket] = await Bracket.create([{
            tournamentId,
            stageId: stageRule._id,
            sport: sportType,
            name: `${sportType} - ${stageConfig.stageName || 'Vòng loại trực tiếp'}`,
            totalTeams: qualifiedTeams.length
        }], { session });

        // 4. Tạo các trận đấu Knock-out dựa trên sơ đồ (Round of 16, Quarter, Semi, Final...)
        const knockoutMatches = await createAllKnockoutMatches({
            teams: qualifiedTeams,
            tournamentId,
            bracketId: knockoutBracket._id,
            stageRuleId: stageRule._id,
            startTime: startTime || new Date(),
            courts: courts.length ? courts : ['Sân 1'],
            matchDuration: matchDuration || 60
        });

        if (knockoutMatches.length > 0) {
            await Match.insertMany(knockoutMatches, { session });
        }

        await session.commitTransaction();
        return res.status(200).json({
            success: true,
            message: 'Đã tiến hành bốc thăm và tạo lịch thi đấu vòng Knock-out thành công!',
            data: { bracketId: knockoutBracket._id, matchCount: knockoutMatches.length }
        });
    } catch (error) {
        await session.abortTransaction();
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

/**
 * Công khai bảng đấu (Chuyển trạng thái từ pending sang progress)
 */
export const publishGroupStage = async (req, res) => {
    try {
        const { tournamentId } = req.params;
        await Group.updateMany({ tournamentId }, { status: 'progress' });
        return res.status(200).json({ success: true, message: 'Đã công khai danh sách bảng đấu.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};