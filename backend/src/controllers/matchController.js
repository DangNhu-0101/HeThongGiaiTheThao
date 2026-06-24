import mongoose from 'mongoose';
import Match from '../models/matches.js';
import StageRule from '../models/rules/stageRules.js';
import Bracket from '../models/rules/brackets.js';
import Group from '../models/groups.js';
import TournamentItem from '../models/tournamentItem.js';
import User from '../models/users.js';
import Organization from '../models/orgs.js';
import Participant from '../models/participants.js';

// ==================== HELPERS ====================

// Kiểm tra quyền admin hoặc org của tournamentItem
const checkPermission = async (userId, tournamentItemId, session) => {
    const user = await User.findById(userId).populate('roles').session(session);
    const hasAdmin = user.roles.some(r => r.name === 'admin');
    if (hasAdmin) return true;
    const tournamentItem = await TournamentItem.findById(tournamentItemId).session(session);
    if (!tournamentItem) throw new Error('TournamentItem not found');
    const isOwner = await Organization.findOne({ _id: tournamentItem.organization, ownerId: userId }).session(session);
    return !!isOwner;
};

// Lấy danh sách participants từ bracket (cho knock-out) hoặc group (cho vòng bảng)
// Ở đây tạm thời lấy winner của các match previous, còn nếu không có previous thì cần lấy từ danh sách đăng ký (có thể thêm sau)
const getParticipantsFromPreviousMatches = async (match, session) => {
    const participants = [];
    if (match.previousMatches && match.previousMatches.length > 0) {
        const prevMatchIds = match.previousMatches.map(p => p.matchId);
        const prevMatches = await Match.find({ _id: { $in: prevMatchIds } }).session(session);
        for (const prev of prevMatches) {
            if (prev.winnerParticipantId) {
                participants.push(prev.winnerParticipantId);
            }
        }
    }
    return participants;
};

// Cập nhật next match sau khi hoàn thành match hiện tại (nếu có)
const updateNextMatch = async (match, session) => {
    if (!match.nextMatchId) return;
    const nextMatch = await Match.findById(match.nextMatchId).session(session);
    if (!nextMatch) return;
    // Kiểm tra xem nextMatch đã có đủ participant chưa (nếu có cấu trúc lưu danh sách tham gia)
    // Có thể thêm logic: nếu nextMatch chưa có participant nào, gán winner vào; nếu đã có thì cập nhật thêm
    // Tùy vào model, ở đây ta không có trường participants, nên chỉ in log hoặc có thể lưu vào trường nào đó nếu mở rộng
    // Ví dụ: nếu có trường participantIds thì push
    // Nếu cần, có thể lưu vào một collection "MatchParticipants" riêng
    // Tạm thời chỉ lưu là đã có thông báo
    console.log(`Match ${match._id} completed, next match ${nextMatch._id} will have winner ${match.winnerParticipantId}`);
    // Có thể tự động set thời gian cho next match nếu cần
};

// ==================== API LẤY DANH SÁCH ====================

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
        if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
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

        // Kiểm tra quyền
        const hasPerm = await checkPermission(userId, match.tournamentItemId, session);
        if (!hasPerm) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: 'Permission denied' });
        }

        // Cập nhật các trường cơ bản
        if (scheduledTime !== undefined) match.scheduledTime = new Date(scheduledTime);
        if (courtId !== undefined) match.courtId = courtId;
        if (status) match.status = status;

        // Xử lý nếu có winnerParticipantId (kết quả trận đấu)
        if (winnerParticipantId) {
            // Kiểm tra participant tồn tại
            const participant = await Participant.findById(winnerParticipantId).session(session);
            if (!participant) {
                await session.abortTransaction();
                return res.status(400).json({ success: false, message: 'Invalid winnerParticipantId' });
            }
            // Kiểm tra xem participant có thuộc về trận đấu không (thường từ previous matches hoặc danh sách đăng ký)
            // Ở đây tạm thời chỉ kiểm tra nếu match có previous matches thì participant phải là winner của một trong số đó
            // Nếu không có previous (ví dụ knock-out từ đầu), cần lấy từ danh sách đăng ký của bracket
            let isValid = false;
            if (match.previousMatches && match.previousMatches.length > 0) {
                const prevMatchIds = match.previousMatches.map(p => p.matchId);
                const prevMatches = await Match.find({ _id: { $in: prevMatchIds } }).session(session);
                const winners = prevMatches.map(m => m.winnerParticipantId ? m.winnerParticipantId.toString() : null);
                if (winners.includes(winnerParticipantId.toString())) {
                    isValid = true;
                }
            } else {
                // Nếu không có previous, có thể kiểm tra xem participant có trong bracket/group không
                // Ở đây tạm thời bỏ qua, coi như hợp lệ
                // Tuy nhiên, để an toàn, bạn nên lấy danh sách participants từ bracket
                // Ví dụ: tìm tất cả participants tham gia bracket (có thể lưu ở Bracket)
                // Ở đây tôi giả định validate sau
                isValid = true;
            }

            if (!isValid) {
                await session.abortTransaction();
                return res.status(400).json({ success: false, message: 'Winner is not eligible for this match' });
            }

            match.winnerParticipantId = participant._id;
            match.status = 'completed';
        }

        // Lưu match
        await match.save({ session });

        // Nếu match vừa hoàn thành và có nextMatchId, cập nhật next match
        if (match.status === 'completed' && match.winnerParticipantId && match.nextMatchId) {
            await updateNextMatch(match, session);
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

        const hasPerm = await checkPermission(userId, match.tournamentItemId, session);
        if (!hasPerm) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: 'Permission denied' });
        }

        if (match.status === 'completed') {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Match already completed' });
        }

        // Lấy danh sách participant có thể tham gia match
        let participants = [];
        if (match.previousMatches && match.previousMatches.length > 0) {
            const prevMatchIds = match.previousMatches.map(p => p.matchId);
            const prevMatches = await Match.find({ _id: { $in: prevMatchIds } }).session(session);
            participants = prevMatches.map(m => m.winnerParticipantId).filter(p => p);
        } else {
            // Nếu không có previous, có thể lấy từ bracket (ví dụ lấy tất cả participants trong bracket)
            // Bạn có thể lưu danh sách participants vào Bracket hoặc Group
            // Ở đây tạm thời lấy từ Bracket (giả sử có trường participantIds)
            // Nếu chưa có, bạn có thể lấy từ đăng ký của tournamentItem
            // Thêm logic sau
            // Tạm thời bỏ qua
        }

        if (participants.length < 2) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Not enough participants to determine winner' });
        }

        // Random chọn người thắng
        const randomIndex = Math.floor(Math.random() * participants.length);
        const winner = participants[randomIndex];

        match.winnerParticipantId = winner;
        match.status = 'completed';
        await match.save({ session });

        // Cập nhật next match nếu có
        if (match.nextMatchId) {
            await updateNextMatch(match, session);
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

// ==================== HOÀN THÀNH MATCH (có chỉ định winner) ====================

export const completeMatch = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const { winnerParticipantId } = req.body;

        if (!winnerParticipantId) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'winnerParticipantId is required' });
        }

        const match = await Match.findById(id).session(session);
        if (!match) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Match not found' });
        }

        const hasPerm = await checkPermission(userId, match.tournamentItemId, session);
        if (!hasPerm) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: 'Permission denied' });
        }

        const participant = await Participant.findById(winnerParticipantId).session(session);
        if (!participant) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Invalid participant' });
        }

        // Kiểm tra eligibility (tương tự như update)
        let isValid = true;
        if (match.previousMatches && match.previousMatches.length > 0) {
            const prevMatchIds = match.previousMatches.map(p => p.matchId);
            const prevMatches = await Match.find({ _id: { $in: prevMatchIds } }).session(session);
            const winners = prevMatches.map(m => m.winnerParticipantId ? m.winnerParticipantId.toString() : null);
            if (!winners.includes(winnerParticipantId.toString())) {
                isValid = false;
            }
        }
        if (!isValid) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Winner is not eligible for this match' });
        }

        match.winnerParticipantId = participant._id;
        match.status = 'completed';
        await match.save({ session });

        // Cập nhật next match
        if (match.nextMatchId) {
            await updateNextMatch(match, session);
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

// ==================== CẬP NHẬT NHIỀU MATCH (có thể dùng cho admin) ====================

export const updateMatches = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const userId = req.user._id;
        const { matches } = req.body; // mảng [{matchId, scheduledTime, courtId, winnerParticipantId}]

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

            const hasPerm = await checkPermission(userId, match.tournamentItemId, session);
            if (!hasPerm) {
                await session.abortTransaction();
                return res.status(403).json({ success: false, message: 'Permission denied for one or more matches' });
            }

            // Cập nhật từng field
            if (item.scheduledTime) match.scheduledTime = new Date(item.scheduledTime);
            if (item.courtId) match.courtId = item.courtId;
            if (item.status) match.status = item.status;
            if (item.winnerParticipantId) {
                const participant = await Participant.findById(item.winnerParticipantId).session(session);
                if (!participant) {
                    await session.abortTransaction();
                    return res.status(400).json({ success: false, message: `Invalid winner for match ${item.matchId}` });
                }
                // Kiểm tra eligibility (tùy chọn)
                match.winnerParticipantId = participant._id;
                match.status = 'completed';
            }

            await match.save({ session });
            updatedMatches.push(match);

            // Nếu match hoàn thành và có nextMatch, cập nhật next match
            if (match.status === 'completed' && match.winnerParticipantId && match.nextMatchId) {
                await updateNextMatch(match, session);
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