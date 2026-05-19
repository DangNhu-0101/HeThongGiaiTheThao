// controllers/matchController.js
import mongoose from 'mongoose';
import Match from '../models/matches.js';
import Group from '../models/groups.js';
import Team from '../models/teams.js';
import BaseRule from '../models/rules/baseRules.js';
import Bracket from '../models/rules/brackets.js';
import { updateStandingsAfterMatch } from '../utils/standingHelper.js';
import { createRoundRobinMatches } from '../utils/matchScheduleHelper.js';

const getTeamDisplayName = (team) => team?.name || team?.teamName || 'Đội chưa đặt tên';

const buildRoundRobinDraft = ({ teams, group, tournamentId, bracketId, stageRuleId, sportType, ruleId, startTime, courts, startMatchNumber }) => {
    const matches = [];
    let matchNumber = startMatchNumber;
    const start = new Date(startTime);
    const courtList = courts?.length ? courts : ['Sân 1'];

    for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
            const scheduledStartTime = new Date(start.getTime() + (matchNumber - startMatchNumber) * 60 * 60 * 1000);
            const courtName = courtList[(matchNumber - startMatchNumber) % courtList.length];
            matches.push({
                tournamentId,
                bracketId,
                stageRuleId,
                groupId: group?._id || null,
                groupName: group?.name || '',
                group: group?.name || '',
                round: 1,
                matchNumber,
                matchType: 'group',
                sportType,
                ruleId,
                team1: teams[i]._id,
                team2: teams[j]._id,
                team1Name: getTeamDisplayName(teams[i]),
                team2Name: getTeamDisplayName(teams[j]),
                scheduledStartTime,
                timestart: scheduledStartTime,
                courtName,
                court: courtName,
                status: 'SCHEDULED'
            });
            matchNumber += 1;
        }
    }

    return matches;
};

export const autoDrawTournamentMatches = async (req, res) => {
    try {
        const { tournamentId } = req.params;
        const { ruleId, startTime, courts = [] } = req.body;

        if (!ruleId || !startTime) {
            return res.status(400).json({ success: false, message: 'Thiếu ruleId hoặc startTime' });
        }

        const rule = await BaseRule.findById(ruleId).populate('tournamentStructure.stages').lean();
        if (!rule) return res.status(404).json({ success: false, message: 'Không tìm thấy luật thi đấu' });

        const sportType = rule.sport || rule.sportType;
        const stageRuleId = rule.tournamentStructure?.stages?.[0]?._id || rule.tournamentStructure?.stages?.[0];
        if (!stageRuleId) {
            return res.status(400).json({ success: false, message: 'Luật chưa có cấu hình vòng đấu' });
        }
        let bracket = await Bracket.findOne({ tournamentId, sport: sportType }).lean();
        if (!bracket) {
            bracket = await Bracket.create({
                tournamentId,
                stageId: stageRuleId,
                sport: sportType,
                name: `${sportType} - Auto bracket`,
                numberOfGroup: 1,
                groups: []
            });
            bracket = bracket.toObject();
        }

        const groups = await Group.find({ bracketId: bracket._id }).populate('teamInGroup').sort({ name: 1 }).lean();
        let matchNumber = 1;
        let draftMatches = [];

        if (groups.length && groups.some(g => g.teamInGroup?.length >= 2)) {
            for (const group of groups) {
                if (group.teamInGroup?.length < 2) continue;
                const groupMatches = buildRoundRobinDraft({
                    teams: group.teamInGroup,
                    group,
                    tournamentId,
                    bracketId: bracket._id,
                    stageRuleId: group.stageRuleId || stageRuleId,
                    sportType,
                    ruleId,
                    startTime,
                    courts,
                    startMatchNumber: matchNumber
                });
                draftMatches = draftMatches.concat(groupMatches);
                matchNumber += groupMatches.length;
            }
        } else {
            const teams = await Team.find({
                tournamentId,
                status: { $in: ['validated', 'confirmed', 'pending'] }
            }).lean();
            const sportTeams = teams.filter(t => !sportType || (t.sportCategory || t.sportType || '').toLowerCase().includes(sportType.toLowerCase()));
            const selectedTeams = sportTeams.length ? sportTeams : teams;

            if (selectedTeams.length < 2) {
                return res.status(400).json({ success: false, message: 'Cần ít nhất 2 đội để tạo lịch' });
            }

            draftMatches = buildRoundRobinDraft({
                teams: selectedTeams,
                group: null,
                tournamentId,
                bracketId: bracket._id,
                stageRuleId,
                sportType,
                ruleId,
                startTime,
                courts,
                startMatchNumber: matchNumber
            });
        }

        return res.json({ success: true, data: draftMatches });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const publishDraftMatches = async (req, res) => {
    try {
        const { matches = [] } = req.body;
        if (!matches.length) {
            return res.status(400).json({ success: false, message: 'Không có trận nháp để công khai' });
        }

        const docs = matches.map((match) => ({
            tournamentId: match.tournamentId,
            bracketId: match.bracketId,
            stageRuleId: match.stageRuleId,
            groupId: match.groupId || null,
            round: match.round || 1,
            matchNumber: match.matchNumber,
            matchType: match.matchType || 'group',
            sportType: match.sportType,
            ruleId: match.ruleId,
            team1: match.team1,
            team2: match.team2,
            scheduledStartTime: match.scheduledStartTime || match.timestart,
            courtName: match.courtName || match.court || '',
            status: 'SCHEDULED'
        }));

        const saved = await Match.insertMany(docs);
        return res.status(201).json({ success: true, data: saved });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

// ==================== TỰ ĐỘNG TẠO LỊCH VÒNG TRÒN CHO GROUP ====================
export const autoGenerateGroupMatches = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { groupId } = req.params;
        const group = await Group.findById(groupId).populate('teamInGroup').session(session);
        if (!group) {
            return res.status(404).json({ success: false, message: 'Group không tồn tại' });
        }
        if (group.teamInGroup.length < 2) {
            return res.status(400).json({ success: false, message: 'Cần ít nhất 2 đội để tạo lịch' });
        }

        // Xóa các match cũ của group này (nếu có)
        await Match.deleteMany({ groupId: group._id, matchType: 'group' }).session(session);

        // Tạo match mới
        const teamIds = group.teamInGroup.map(t => t._id);
        const matches = createRoundRobinMatches(
            teamIds,
            group._id,
            group.tournamentId,
            group.bracketId,
            group.stageRuleId,
            group.sport,
            group.ruleId // nếu có
        );

        if (matches.length) {
            await Match.insertMany(matches, { session });
        }

        await session.commitTransaction();
        res.json({ success: true, message: `Đã tạo ${matches.length} trận đấu cho group ${group.name}` });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// ==================== TỰ ĐỘNG TẠO LỊCH CHO TẤT CẢ GROUP CỦA GIẢI ====================
export const autoGenerateAllGroupMatches = async (req, res) => {
    try {
        const { tournamentId, sportType } = req.query;
        const groups = await Group.find({ tournamentId, sport: sportType });
        if (!groups.length) {
            return res.status(400).json({ success: false, message: 'Không có group nào' });
        }
        const results = [];
        for (const group of groups) {
            // Gọi lại hàm trên cho từng group (có thể dùng transaction nhưng sẽ lâu)
            if (group.teamInGroup.length >= 2) {
                await Match.deleteMany({ groupId: group._id, matchType: 'group' });
                const teamIds = group.teamInGroup.map(t => t);
                const matches = createRoundRobinMatches(
                    teamIds,
                    group._id,
                    group.tournamentId,
                    group.bracketId,
                    group.stageRuleId,
                    group.sport,
                    group.ruleId
                );
                if (matches.length) await Match.insertMany(matches);
                results.push({ group: group.name, matches: matches.length });
            }
        }
        res.json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== CRUD CƠ BẢN ====================
export const getMatches = async (req, res) => {
    try {
        const { tournamentId, groupId, round, status, matchType } = req.query;
        const filter = {};
        if (tournamentId) filter.tournamentId = tournamentId;
        if (groupId) filter.groupId = groupId;
        if (round) filter.round = parseInt(round);
        if (status) filter.status = status;
        if (matchType) filter.matchType = matchType;

        const matches = await Match.find(filter)
            .populate('team1 team2', 'name')
            .populate('winnerTeamId', 'name')
            .populate('groupId', 'name')
            .populate('courtId', 'name')
            .sort({ matchNumber: 1 });
        res.json({ success: true, data: matches });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMatchById = async (req, res) => {
    try {
        const match = await Match.findById(req.params.id)
            .populate('team1 team2 winnerTeamId', 'name');
        if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
        res.json({ success: true, data: match });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Tạo match thủ công (admin)
export const createManualMatch = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const matchData = req.body;
        const newMatch = await Match.create([matchData], { session });
        await session.commitTransaction();
        res.status(201).json({ success: true, data: newMatch[0] });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// Cập nhật match (lịch, sân, trọng tài)
export const updateMatch = async (req, res) => {
    try {
        const { id } = req.params;
        const allowed = ['scheduledStartTime', 'courtId', 'courtName', 'refereeId', 'lineReferees', 'matchName', 'actualStartTime', 'durationMinutes'];
        const updateData = {};
        allowed.forEach(f => { if (req.body[f] !== undefined) updateData[f] = req.body[f]; });
        const match = await Match.findByIdAndUpdate(id, updateData, { new: true });
        if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
        res.json({ success: true, data: match });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const deleteMatch = async (req, res) => {
    try {
        const match = await Match.findByIdAndDelete(req.params.id);
        if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
        res.json({ success: true, message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Cập nhật trạng thái match (bắt đầu, tạm dừng, kết thúc)
export const updateMatchStatus = async (req, res) => {
    try {
        const { status, actualStartTime } = req.body;
        const allowed = ['SCHEDULED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'CANCELED', 'POSTPONED'];
        if (!allowed.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
        const match = await Match.findById(req.params.id);
        if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
        match.status = status;
        if (status === 'IN_PROGRESS' && actualStartTime) match.actualStartTime = actualStartTime;
        if (status === 'IN_PROGRESS' && !match.actualStartTime) match.actualStartTime = new Date();
        if (status === 'COMPLETED') match.endTime = new Date();
        await match.save();
        res.json({ success: true, data: match });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Cập nhật tỷ số (kèm cập nhật bảng xếp hạng)
export const updateMatchScore = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        const { team1Score, team2Score, sets } = req.body;
        const match = await Match.findById(id).populate('team1 team2').session(session);
        if (!match) throw new Error('Match not found');
        if (match.status === 'COMPLETED') throw new Error('Match already completed');

        match.team1Score = team1Score;
        match.team2Score = team2Score;
        if (sets) match.sets = sets;
        match.status = 'COMPLETED';
        match.endTime = new Date();
        if (match.actualStartTime) {
            match.durationMinutes = Math.round((match.endTime - match.actualStartTime) / 60000);
        }

        let winnerId = null;
        if (team1Score > team2Score) winnerId = match.team1?._id;
        else if (team2Score > team1Score) winnerId = match.team2?._id;
        if (winnerId) {
            match.winnerTeamId = winnerId;
            match.result = winnerId === match.team1?._id ? 'TEAM1_WIN' : 'TEAM2_WIN';
        } else {
            match.result = 'DRAW';
        }
        await match.save({ session });

        // Nếu là vòng bảng -> cập nhật bảng xếp hạng
        if (match.matchType === 'group' && match.groupId) {
            await updateStandingsAfterMatch(match, team1Score, team2Score, session);
        }

        await session.commitTransaction();
        res.json({ success: true, data: match });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};
