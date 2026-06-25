// controllers/matchController.js
import mongoose from 'mongoose';
import Match from '../models/matches.js';
import StageRule from '../models/rules/stageRules.js';
import Bracket from '../models/rules/brackets.js';
import Group from '../models/groups.js';
import TournamentItem from '../models/tournamentItem.js';
import Participant from '../models/participants.js';
import MatchResult from '../models/matchResults.js';
import { checkPermission, checkTournamentItemStatusForMatch } from '../utils/tournamentHelper.js';

// ==================== HELPERS ====================

/**
 * Kiểm tra quyền trên match: user là admin hoặc owner của tournamentItem
 */
const checkMatchPermission = async (userId, tournamentItemId) => {
    const perm = await checkPermission(userId, tournamentItemId);
    if (!perm.allowed) {
        return { allowed: false, message: perm.message };
    }
    return { allowed: true, user: perm.user, isAdmin: perm.isAdmin, isOwner: perm.isOwner };
};

/**
 * Lấy danh sách participants hợp lệ cho match (từ previous matches)
 * Nếu không có previous, lấy từ danh sách đăng ký (participants) của tournament item
 */
const getEligibleParticipants = async (match, session) => {
    let eligible = [];
    // 1. Lấy từ previous matches
    if (match.previousMatches && match.previousMatches.length > 0) {
        const prevMatchIds = match.previousMatches.map(p => p.matchId);
        const prevMatches = await Match.find({ _id: { $in: prevMatchIds } }).session(session);
        eligible = prevMatches.map(m => m.winnerParticipantId).filter(p => p);
    } else {
        // 2. Nếu không có previous, lấy tất cả participants của tournament item
        // (có thể lọc theo bracket/group nếu cần)
        const participants = await Participant.find({
            tournamentItemId: match.tournamentItemId
        }).session(session);
        eligible = participants.map(p => p._id);
    }
    return eligible;
};

/**
 * Tạo hoặc cập nhật MatchResult khi match hoàn thành
 */
const createMatchResult = async (match, winnerId, loserId = null, scores = {}, session) => {
    let matchResult = await MatchResult.findOne({ matchId: match._id }).session(session);
    if (!matchResult) {
        matchResult = new MatchResult({
            matchId: match._id,
            tournamentItemId: match.tournamentItemId,
            winnerParticipantId: winnerId,
            winnerScore: scores.winner || 0,
            loserScore: scores.loser || 0,
            details: scores.details || {},
            statistics: scores.statistics || {},
            status: 'confirmed'
        });
    } else {
        matchResult.winnerParticipantId = winnerId;
        if (scores.winner !== undefined) matchResult.winnerScore = scores.winner;
        if (scores.loser !== undefined) matchResult.loserScore = scores.loser;
        if (scores.details) matchResult.details = scores.details;
        if (scores.statistics) matchResult.statistics = scores.statistics;
        matchResult.status = 'confirmed';
    }
    await matchResult.save({ session });
    return matchResult;
};

/**
 * Cập nhật next match khi match hiện tại hoàn thành
 * Gắn winner vào next match (nếu next match chưa có winner)
 */
const updateNextMatchWithWinner = async (match, winnerId, session) => {
    if (!match.nextMatchId) return;
    const nextMatch = await Match.findById(match.nextMatchId).session(session);
    if (!nextMatch) return;

    // Nếu nextMatch đã có winner, không làm gì (chỉ log)
    if (nextMatch.winnerParticipantId) {
        console.log(`Next match ${nextMatch._id} already has winner ${nextMatch.winnerParticipantId}`);
        return;
    }

    // Gán winner cho nextMatch (tạm thời, nhưng thực tế cần xác định đối thủ còn lại)
    // Có thể lưu vào một trường pendingWinner
    // Tạm thời không gán, mà chỉ update trạng thái
    console.log(`Match ${match._id} completed, winner ${winnerId} advances to match ${nextMatch._id}`);

    // Nếu muốn tự động gán, có thể:
    // nextMatch.winnerParticipantId = winnerId;
    // await nextMatch.save({ session });
};

// ==================== API LẤY DANH SÁCH ====================

export const getMatchesByTournamentItem = async (req, res) => {
    try {
        const { tournamentItemId } = req.params;
        const matches = await Match.find({ tournamentItemId })
            .populate('winnerParticipantId', 'name logo')
            .populate('groupId', 'name')
            .populate('bracketId', 'name type')
            .populate('stageId', 'name')
            .sort({ round: 1, 'previousMatches.matchId': 1 });
        return res.json({ success: true, data: matches });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getMatchesByStage = async (req, res) => {
    try {
        const { stageId } = req.params;
        const matches = await Match.find({ stageId })
            .populate('winnerParticipantId', 'name logo')
            .populate('groupId', 'name')
            .populate('bracketId', 'name type')
            .sort({ round: 1, 'previousMatches.matchId': 1 });
        return res.json({ success: true, data: matches });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getMatchesByBracket = async (req, res) => {
    try {
        const { bracketId } = req.params;
        const matches = await Match.find({ bracketId })
            .populate('winnerParticipantId', 'name logo')
            .populate('groupId', 'name')
            .sort({ round: 1, 'previousMatches.matchId': 1 });
        return res.json({ success: true, data: matches });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getMatchesByGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const matches = await Match.find({ groupId })
            .populate('winnerParticipantId', 'name logo')
            .sort({ round: 1, 'previousMatches.matchId': 1 });
        return res.json({ success: true, data: matches });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getMatchById = async (req, res) => {
    try {
        const match = await Match.findById(req.params.id)
            .populate('winnerParticipantId', 'name logo')
            .populate('previousMatches.matchId', 'name winnerParticipantId status')
            .populate('nextMatchId', 'name')
            .populate('nextLoserMatchId', 'name');
        if (!match) {
            return res.status(404).json({ success: false, message: 'Match not found' });
        }
        return res.json({ success: true, data: match });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== CẬP NHẬT MATCH ====================

export const updateMatch = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const { scheduledTime, courtId, status, winnerParticipantId, participantScores } = req.body;

        const match = await Match.findById(id).session(session);
        if (!match) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Match not found' });
        }

        // 1. Kiểm tra quyền
        const perm = await checkMatchPermission(userId, match.tournamentItemId);
        if (!perm.allowed) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: perm.message });
        }

        // 2. Kiểm tra trạng thái tournament
        const statusCheck = await checkTournamentItemStatusForMatch(match.tournamentItemId, perm.user.roles);
        if (!statusCheck.valid) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: statusCheck.message });
        }

        // 3. Không cho sửa match đã completed (trừ admin)
        const isAdmin = perm.user.roles.some(r => r.name === 'admin');
        if (match.status === 'completed' && !isAdmin) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Cannot modify a completed match' });
        }

        // 4. Cập nhật các trường cơ bản
        if (scheduledTime !== undefined) match.scheduledTime = new Date(scheduledTime);
        if (courtId !== undefined) match.courtId = courtId;
        if (status) match.status = status;

        // 5. Xử lý winnerParticipantId (nếu có)
        if (winnerParticipantId) {
            const participant = await Participant.findById(winnerParticipantId).session(session);
            if (!participant) {
                await session.abortTransaction();
                return res.status(400).json({ success: false, message: 'Invalid winnerParticipantId' });
            }

            // Kiểm tra eligibility
            const eligible = await getEligibleParticipants(match, session);
            const eligibleIds = eligible.map(p => p.toString());
            if (!eligibleIds.includes(winnerParticipantId.toString())) {
                await session.abortTransaction();
                return res.status(400).json({ success: false, message: 'Winner is not eligible for this match' });
            }

            match.winnerParticipantId = participant._id;
            match.status = 'completed';

            // Tạo MatchResult
            const scores = {
                winner: participantScores?.winner || 0,
                loser: participantScores?.loser || 0,
                details: participantScores?.details || {},
                statistics: participantScores?.statistics || {}
            };
            await createMatchResult(match, participant._id, null, scores, session);
        }

        // 6. Lưu match
        await match.save({ session });

        // 7. Nếu match vừa hoàn thành và có nextMatchId, cập nhật next match
        if (match.status === 'completed' && match.winnerParticipantId && match.nextMatchId) {
            await updateNextMatchWithWinner(match, match.winnerParticipantId, session);
        }

        await session.commitTransaction();
        return res.json({ success: true, data: match });
    } catch (error) {
        await session.abortTransaction();
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// ==================== AUTO RESULT ====================

export const autoResultMatch = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const match = await Match.findById(id).session(session);
        if (!match) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Match not found' });
        }

        const perm = await checkMatchPermission(userId, match.tournamentItemId);
        if (!perm.allowed) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: perm.message });
        }

        if (match.status === 'completed') {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Match already completed' });
        }

        // Lấy danh sách eligible participants
        let eligible = await getEligibleParticipants(match, session);
        if (!eligible || eligible.length < 2) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Not enough eligible participants for auto result' });
        }

        // Random chọn winner
        const randomIndex = Math.floor(Math.random() * eligible.length);
        const winner = eligible[randomIndex];

        match.winnerParticipantId = winner;
        match.status = 'completed';
        await match.save({ session });

        // Tạo MatchResult
        await createMatchResult(match, winner, null, { winner: 0, loser: 0 }, session);

        // Cập nhật next match nếu có
        if (match.nextMatchId) {
            await updateNextMatchWithWinner(match, winner, session);
        }

        await session.commitTransaction();
        return res.json({ success: true, message: 'Auto result set', data: match });
    } catch (error) {
        await session.abortTransaction();
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// ==================== HOÀN THÀNH MATCH ====================

export const completeMatch = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const { winnerParticipantId, participantScores } = req.body;

        if (!winnerParticipantId) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'winnerParticipantId is required' });
        }

        const match = await Match.findById(id).session(session);
        if (!match) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Match not found' });
        }

        const perm = await checkMatchPermission(userId, match.tournamentItemId);
        if (!perm.allowed) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: perm.message });
        }

        if (match.status === 'completed') {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Match already completed' });
        }

        const participant = await Participant.findById(winnerParticipantId).session(session);
        if (!participant) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Invalid participant' });
        }

        // Kiểm tra eligibility
        const eligible = await getEligibleParticipants(match, session);
        const eligibleIds = eligible.map(p => p.toString());
        if (!eligibleIds.includes(winnerParticipantId.toString())) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Winner is not eligible for this match' });
        }

        match.winnerParticipantId = participant._id;
        match.status = 'completed';
        await match.save({ session });

        // Tạo MatchResult
        const scores = {
            winner: participantScores?.winner || 0,
            loser: participantScores?.loser || 0,
            details: participantScores?.details || {},
            statistics: participantScores?.statistics || {}
        };
        await createMatchResult(match, participant._id, null, scores, session);

        if (match.nextMatchId) {
            await updateNextMatchWithWinner(match, participant._id, session);
        }

        await session.commitTransaction();
        return res.json({ success: true, data: match });
    } catch (error) {
        await session.abortTransaction();
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// ==================== BULK UPDATE MATCHES ====================

export const updateMatches = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const userId = req.user._id;
        const { matches } = req.body; // mảng [{matchId, scheduledTime, courtId, winnerParticipantId, participantScores}]

        if (!Array.isArray(matches) || matches.length === 0) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Invalid matches data' });
        }

        const updatedMatches = [];
        for (const item of matches) {
            const match = await Match.findById(item.matchId).session(session);
            if (!match) {
                await session.abortTransaction();
                return res.status(404).json({ success: false, message: `Match ${item.matchId} not found` });
            }

            const perm = await checkMatchPermission(userId, match.tournamentItemId);
            if (!perm.allowed) {
                await session.abortTransaction();
                return res.status(403).json({ success: false, message: `Permission denied for match ${item.matchId}` });
            }

            const statusCheck = await checkTournamentItemStatusForMatch(match.tournamentItemId, perm.user.roles);
            if (!statusCheck.valid) {
                await session.abortTransaction();
                return res.status(400).json({ success: false, message: `Cannot modify match ${item.matchId}: ${statusCheck.message}` });
            }

            if (item.scheduledTime) match.scheduledTime = new Date(item.scheduledTime);
            if (item.courtId) match.courtId = item.courtId;
            if (item.status) match.status = item.status;

            if (item.winnerParticipantId) {
                const participant = await Participant.findById(item.winnerParticipantId).session(session);
                if (!participant) {
                    await session.abortTransaction();
                    return res.status(400).json({ success: false, message: `Invalid winner for match ${item.matchId}` });
                }
                const eligible = await getEligibleParticipants(match, session);
                const eligibleIds = eligible.map(p => p.toString());
                if (!eligibleIds.includes(item.winnerParticipantId.toString())) {
                    await session.abortTransaction();
                    return res.status(400).json({ success: false, message: `Winner not eligible for match ${item.matchId}` });
                }
                match.winnerParticipantId = participant._id;
                match.status = 'completed';

                const scores = {
                    winner: item.participantScores?.winner || 0,
                    loser: item.participantScores?.loser || 0,
                    details: item.participantScores?.details || {},
                    statistics: item.participantScores?.statistics || {}
                };
                await createMatchResult(match, participant._id, null, scores, session);
            }

            await match.save({ session });
            updatedMatches.push(match);

            if (match.status === 'completed' && match.winnerParticipantId && match.nextMatchId) {
                await updateNextMatchWithWinner(match, match.winnerParticipantId, session);
            }
        }

        await session.commitTransaction();
        return res.json({ success: true, message: 'Matches updated', data: updatedMatches });
    } catch (error) {
        await session.abortTransaction();
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// ==================== DELETE MATCH ====================

export const deleteMatch = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const match = await Match.findById(id).session(session);
        if (!match) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Match not found' });
        }

        const perm = await checkMatchPermission(userId, match.tournamentItemId);
        if (!perm.allowed) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: perm.message });
        }

        const statusCheck = await checkTournamentItemStatusForMatch(match.tournamentItemId, perm.user.roles);
        if (!statusCheck.valid) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: statusCheck.message });
        }

        if (match.status === 'completed') {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Cannot delete a completed match' });
        }

        // Xóa MatchResult nếu có
        if (match.matchResultId) {
            await MatchResult.deleteOne({ _id: match.matchResultId }).session(session);
        }

        // Cập nhật các match khác tham chiếu đến match này (xóa tham chiếu)
        await Match.updateMany(
            { 'previousMatches.matchId': match._id },
            { $pull: { previousMatches: { matchId: match._id } } },
            { session }
        );
        await Match.updateMany(
            { nextMatchId: match._id },
            { $set: { nextMatchId: null } },
            { session }
        );
        await Match.updateMany(
            { nextLoserMatchId: match._id },
            { $set: { nextLoserMatchId: null } },
            { session }
        );

        // Cập nhật Group/Bracket nếu cần (xóa match khỏi mảng matches)
        if (match.groupId) {
            await Group.updateOne(
                { _id: match.groupId },
                { $pull: { matches: match._id } },
                { session }
            );
        }

        await match.deleteOne({ session });

        await session.commitTransaction();
        return res.json({ success: true, message: 'Match deleted successfully' });
    } catch (error) {
        await session.abortTransaction();
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};