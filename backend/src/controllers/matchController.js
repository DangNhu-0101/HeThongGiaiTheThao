// controllers/matchController.js
import mongoose from 'mongoose';
import Match from '../models/matches.js';
import StageRule from '../models/rules/stageRules.js';
import Bracket from '../models/rules/brackets.js';
import Group from '../models/groups.js';
import TournamentItem from '../models/tournamentItem.js';
import Participant from '../models/participants.js';
import MatchResult from '../models/matchResults.js';
import KnockoutResult from '../models/knockoutResults.js';
import Court from '../models/courts.js';
import Standing from '../models/standings.js';
import TournamentReferee from '../models/tournamentReferees.js';
import { checkTournamentItemPermission, checkTournamentItemStatusForMatch } from '../utils/tournamentHelper.js';
import { MATCH_STATUS_TAGS, MATCH_STATUS_VALUES } from '../config/matchStatusTags.js';
import {
    compareStandingRows,
    getStageRuleContext,
    getStandingPoints,
    validateMatchScores
} from '../services/competitionRuleEngine.js';
import { syncLiveMatches } from '../services/matchStatusScheduler.js';

// ==================== HELPERS ====================

/**
 * Kiểm tra quyền trên match: user là admin hoặc owner của tournamentItem
 */
const checkMatchPermission = async (userId, tournamentItemId) => {
    const perm = await checkTournamentItemPermission(tournamentItemId, userId);
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
    const eligibleById = new Map();
    (match.participants || []).forEach((participant) => {
        const participantId = participant?._id || participant;
        if (participantId) eligibleById.set(String(participantId), participantId);
    });
    if (match.previousMatches && match.previousMatches.length > 0) {
        const prevMatchIds = match.previousMatches.map(p => p.matchId);
        const prevMatches = await Match.find({ _id: { $in: prevMatchIds } }).session(session);
        prevMatches.map(m => m.winnerParticipantId).filter(p => p).forEach((participantId) => {
            eligibleById.set(String(participantId), participantId);
        });
    }
    if (eligibleById.size === 0) {
        const participants = await Participant.find({
            tournamentItemId: match.tournamentItemId
        }).session(session);
        participants.map(p => p._id).forEach((participantId) => {
            eligibleById.set(String(participantId), participantId);
        });
    }
    return Array.from(eligibleById.values());
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
        if (scores.isDraw !== undefined) matchResult.isDraw = Boolean(scores.isDraw);
        matchResult.status = 'confirmed';
    }
    if (scores.isDraw !== undefined) matchResult.isDraw = Boolean(scores.isDraw);
    await matchResult.save({ session });
    if (!match.matchResultId || String(match.matchResultId) !== String(matchResult._id)) {
        match.matchResultId = matchResult._id;
        await match.save({ session });
    }
    return matchResult;
};

const saveLiveMatchScore = async (match, scores = {}, userId, session) => {
    let matchResult = await MatchResult.findOne({ matchId: match._id }).session(session);
    const details = scores.details || {};
    const teamA = Number(details.teamA ?? scores.teamA ?? 0);
    const teamB = Number(details.teamB ?? scores.teamB ?? 0);
    const highScore = Math.max(teamA, teamB);
    const lowScore = Math.min(teamA, teamB);
    const currentSnapshot = matchResult ? {
        winnerScore: matchResult.winnerScore,
        loserScore: matchResult.loserScore,
        details: matchResult.details,
        status: matchResult.status,
    } : null;

    if (!matchResult) {
        matchResult = new MatchResult({
            matchId: match._id,
            tournamentItemId: match.tournamentItemId,
            winnerScore: highScore,
            loserScore: lowScore,
            details: { ...details, teamA, teamB, live: true },
            statistics: scores.statistics || {},
            status: 'pending',
        });
    } else {
        matchResult.winnerScore = highScore;
        matchResult.loserScore = lowScore;
        matchResult.details = { ...(matchResult.details || {}), ...details, teamA, teamB, live: true };
        if (scores.statistics) matchResult.statistics = scores.statistics;
        matchResult.status = 'pending';
        matchResult.winnerParticipantId = null;
        matchResult.isDraw = teamA === teamB;
    }
    matchResult.history.push({
        updatedBy: userId,
        oldResult: currentSnapshot,
        newResult: {
            winnerScore: highScore,
            loserScore: lowScore,
            details: matchResult.details,
            status: 'pending',
        },
        reason: 'live-score',
    });
    await matchResult.save({ session });
    if (!match.matchResultId || String(match.matchResultId) !== String(matchResult._id)) {
        match.matchResultId = matchResult._id;
        await match.save({ session });
    }
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
    const slotIndex = (nextMatch.previousMatches || []).findIndex((entry) => String(entry.matchId) === String(match._id));
    const targetIndex = slotIndex >= 0 ? slotIndex : Math.max(0, nextMatch.participants?.length || 0);
    const participants = Array.isArray(nextMatch.participants) ? [...nextMatch.participants] : [];
    participants[targetIndex] = winnerId;
    nextMatch.participants = participants.filter(Boolean);
    await nextMatch.save({ session });
    console.info('[match.complete] winner advanced', {
        sourceMatchId: String(match._id),
        nextMatchId: String(nextMatch._id),
        winnerParticipantId: String(winnerId),
        slotIndex: targetIndex,
    });
    return;

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

const normalizeRankKey = (value) => {
    const normalized = String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toUpperCase();
    const tokens = normalized.split(/\s+/).filter(Boolean);
    if (tokens.length > 1 && /^[A-Z0-9]+$/.test(tokens[tokens.length - 1])) {
        return tokens[tokens.length - 1];
    }
    return normalized
        .replace(/^(BANG|GROUP|POOL)\s+/i, '')
        .replace(/\s+/g, '');
};

const normalizeRankSlotKey = (value) => {
    const normalized = String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toUpperCase();
    const compact = normalized.replace(/\s+/g, '');
    if (/^[A-Z]+\d+$/.test(compact)) return compact;

    const tokens = normalized.split(/\s+/).filter(Boolean);
    const rankWords = new Map([
        ['NHAT', 1], ['FIRST', 1], ['WINNER', 1],
        ['NHI', 2], ['SECOND', 2], ['RUNNERUP', 2],
        ['BA', 3], ['THIRD', 3],
        ['TU', 4], ['FOURTH', 4],
    ]);
    const rank = tokens.map((token) => rankWords.get(token)).find(Boolean);
    if (rank) {
        const groupToken = [...tokens].reverse().find((token) => /^[A-Z]+$/.test(token) && !rankWords.has(token) && !['BANG', 'GROUP', 'POOL'].includes(token));
        if (groupToken) return `${groupToken}${rank}`;
    }
    return normalizeRankKey(value);
};

const rankKeyForGroup = (groupName, rank) => `${normalizeRankKey(groupName)}${rank}`;
const COMPLETE_STATUSES = ['completed', 'walkover', 'forfeited'];
const normalizeMatchCode = (value) => String(value || '').trim().toUpperCase();

const branchKeyForMatch = (match) => {
    const nodeParts = String(match.formatNodeId || '').split(':').filter(Boolean);
    if (nodeParts.length >= 2) return nodeParts[1];
    return String(match.bracketId?._id || match.bracketId || '');
};

const idsEqual = (left, right) => String(left || '') === String(right || '');

const slotIndexFromWinnerDependency = (targetMatch, sourceMatch) => {
    const sourceId = String(sourceMatch._id || '');
    const sourceCode = normalizeMatchCode(sourceMatch.name);
    const slotSources = Array.isArray(targetMatch.slotSources) ? targetMatch.slotSources : [];
    const structuredIndex = slotSources.findIndex((slot) => {
        return slot?.sourceType === 'winnerOfMatch'
            && (
                idsEqual(slot.sourceMatchId, sourceId)
                || (sourceCode && normalizeMatchCode(slot.sourceMatchCode || slot.sourceKey) === sourceCode)
            );
    });
    if (structuredIndex >= 0) {
        const slot = slotSources[structuredIndex];
        return Number.isInteger(slot.slotIndex) ? Number(slot.slotIndex) : structuredIndex;
    }

    const previousMatches = Array.isArray(targetMatch.previousMatches) ? targetMatch.previousMatches : [];
    const previousIndex = previousMatches.findIndex((entry) => {
        const position = String(entry?.position || 'WINNER').toUpperCase();
        return position === 'WINNER' && idsEqual(entry?.matchId?._id || entry?.matchId, sourceId);
    });
    if (previousIndex >= 0) return previousIndex;

    const labels = Array.isArray(targetMatch.formatSlotLabels) ? targetMatch.formatSlotLabels : [];
    return labels.findIndex((label) => normalizeMatchCode(label).replace(/^WINNER:\s*/i, '') === sourceCode);
};

const ensureWinnerSlotSource = (targetMatch, slotIndex, sourceMatch) => {
    const slotSources = Array.isArray(targetMatch.slotSources) ? [...targetMatch.slotSources] : [];
    const existingIndex = slotSources.findIndex((slot) => Number(slot?.slotIndex) === slotIndex);
    const nextSource = {
        slotIndex,
        sourceType: 'winnerOfMatch',
        sourceMatchId: sourceMatch._id,
        sourceMatchCode: sourceMatch.name,
        sourceStageId: sourceMatch.stageId?._id || sourceMatch.stageId || null,
        sourceBranchKey: branchKeyForMatch(sourceMatch),
        sourceKey: sourceMatch.name,
    };
    if (existingIndex >= 0) {
        const currentSource = typeof slotSources[existingIndex]?.toObject === 'function'
            ? slotSources[existingIndex].toObject()
            : slotSources[existingIndex];
        slotSources[existingIndex] = { ...currentSource, ...nextSource };
    } else {
        slotSources.push(nextSource);
    }
    targetMatch.slotSources = slotSources;
};

const propagateWinnerToDependentMatches = async (sourceMatch, winnerId, session) => {
    if (!sourceMatch?._id || !winnerId) return { updated: 0, unchanged: 0, targets: [] };
    const sourceCode = normalizeMatchCode(sourceMatch.name);
    const sourceBranchKey = branchKeyForMatch(sourceMatch);
    const candidateMatches = await Match.find({
        tournamentItemId: sourceMatch.tournamentItemId,
        _id: { $ne: sourceMatch._id },
    })
        .populate('stageId', 'name number')
        .populate('bracketId', 'name type')
        .session(session);

    let updated = 0;
    let unchanged = 0;
    const targets = [];
    for (const target of candidateMatches) {
        const hasExactPrevious = (target.previousMatches || []).some((entry) => idsEqual(entry?.matchId?._id || entry?.matchId, sourceMatch._id));
        const hasExactNext = idsEqual(sourceMatch.nextMatchId?._id || sourceMatch.nextMatchId, target._id);
        const targetBranchKey = branchKeyForMatch(target);
        const branchMatches = !sourceBranchKey || !targetBranchKey || sourceBranchKey === targetBranchKey;
        const slotIndex = slotIndexFromWinnerDependency(target, sourceMatch);
        if (slotIndex < 0) continue;
        if (!branchMatches && !hasExactPrevious && !hasExactNext) continue;

        const participants = Array.isArray(target.participants) ? [...target.participants] : [];
        while (participants.length <= slotIndex) participants.push(null);
        const currentParticipantId = participants[slotIndex]?._id || participants[slotIndex] || null;
        if (currentParticipantId && !idsEqual(currentParticipantId, winnerId)) {
            console.error('[match.complete] dependency slot conflict', {
                sourceMatchId: String(sourceMatch._id),
                sourceMatchCode: sourceCode,
                targetMatchId: String(target._id),
                targetMatchCode: target.name,
                slotIndex,
                currentParticipantId: String(currentParticipantId),
                winnerParticipantId: String(winnerId),
            });
            const error = new Error('Dependency slot already has a different participant');
            error.status = 409;
            error.title = 'Xung dot slot knockout';
            error.clientMessage = `Slot ${slotIndex + 1} cua trận ${target.name} da co doi khac, khong the tu dong gán đội thạng ${sourceCode}.`;
            throw error;
        }

        ensureWinnerSlotSource(target, slotIndex, sourceMatch);
        if (currentParticipantId && idsEqual(currentParticipantId, winnerId)) {
            unchanged++;
        } else {
            participants[slotIndex] = winnerId;
            target.participants = participants;
            target.markModified('participants');
            updated++;
        }
        await target.save({ session });
        targets.push({ matchId: target._id, matchCode: target.name, slotIndex });
        console.info('[match.complete] winner propagated to dependency slot', {
            sourceMatchId: String(sourceMatch._id),
            sourceMatchCode: sourceCode,
            targetMatchId: String(target._id),
            targetMatchCode: target.name,
            slotIndex,
            winnerParticipantId: String(winnerId),
        });
    }
    return { updated, unchanged, targets };
};

const syncCompletedKnockoutAdvancement = async (tournamentItemId, session = null) => {
    const completedMatches = await Match.find({
        tournamentItemId,
        status: { $in: COMPLETE_STATUSES },
        winnerParticipantId: { $ne: null },
    })
        .populate('stageId', 'name number')
        .populate('bracketId', 'name type')
        .session(session);
    const summary = { updated: 0, unchanged: 0, targets: 0, sources: 0 };
    for (const sourceMatch of completedMatches) {
        if (String(sourceMatch.bracketId?.type || '') !== 'knockout') continue;
        const result = await propagateWinnerToDependentMatches(sourceMatch, sourceMatch.winnerParticipantId, session);
        summary.updated += result.updated || 0;
        summary.unchanged += result.unchanged || 0;
        summary.targets += result.targets?.length || 0;
        summary.sources += 1;
    }
    if (summary.updated > 0) {
        console.info('[match.complete] repaired knockout advancement from completed matches', {
            tournamentItemId: String(tournamentItemId),
            ...summary,
        });
    }
    return summary;
};

const resolveWinnerParticipantFromSource = (sourceMatch) => {
    const winner = sourceMatch?.winnerParticipantId?._id || sourceMatch?.winnerParticipantId || null;
    return winner || null;
};

const resolveMatchDependencyParticipants = async (match, session) => {
    const labels = Array.isArray(match.formatSlotLabels) ? match.formatSlotLabels : [];
    const hasMatchDependencyLabel = labels.some((label) => /^M\d+$/i.test(String(label || '').trim()));
    const hasPreviousDependencies = Array.isArray(match.previousMatches) && match.previousMatches.length > 0;
    if (!hasMatchDependencyLabel && !hasPreviousDependencies) return { updated: false, participants: match.participants || [] };

    const targetStage = await StageRule.findById(match.stageId?._id || match.stageId).select('number name').session(session);
    const sourceMatches = await Match.find({
        tournamentItemId: match.tournamentItemId,
        status: { $in: COMPLETE_STATUSES },
        winnerParticipantId: { $ne: null },
    })
        .populate('stageId', 'number name')
        .populate('bracketId', 'type name')
        .session(session);
    const sourceById = new Map(sourceMatches.map((source) => [String(source._id), source]));
    const targetBranchKey = branchKeyForMatch(match);
    const targetStageNumber = Number(targetStage?.number || match.stageId?.number || 0);
    const participants = Array.isArray(match.participants) ? [...match.participants] : [];
    let updated = false;

    const assignSlot = (slotIndex, sourceMatch, sourceKey) => {
        const winnerId = resolveWinnerParticipantFromSource(sourceMatch);
        if (!winnerId) return;
        while (participants.length <= slotIndex) participants.push(null);
        const currentId = participants[slotIndex]?._id || participants[slotIndex] || null;
        if (currentId && !idsEqual(currentId, winnerId)) {
            const error = new Error('Dependency slot already has a different participant');
            error.status = 409;
            error.title = 'Xung dot slot knockout';
            error.clientMessage = `Slot ${slotIndex + 1} cua trận ${match.name} da co doi khac, khong the gán đội thạng ${sourceKey}.`;
            throw error;
        }
        if (!currentId) {
            participants[slotIndex] = winnerId;
            updated = true;
        }
        ensureWinnerSlotSource(match, slotIndex, sourceMatch);
    };

    (match.previousMatches || []).forEach((entry, index) => {
        if (String(entry?.position || 'WINNER').toUpperCase() !== 'WINNER') return;
        const source = sourceById.get(String(entry?.matchId?._id || entry?.matchId || ''));
        if (source) assignSlot(index, source, source.name);
    });

    labels.forEach((label, index) => {
        const sourceCode = normalizeMatchCode(label).replace(/^WINNER:\s*/i, '');
        if (!/^M\d+$/i.test(sourceCode)) return;
        if (participants[index]?._id || participants[index]) return;
        const sourceCandidates = sourceMatches
            .filter((candidate) => {
                if (normalizeMatchCode(candidate.name) !== sourceCode) return false;
                const sourceStageNumber = Number(candidate.stageId?.number || 0);
                if (targetStageNumber && sourceStageNumber >= targetStageNumber) return false;
                const sourceBranchKey = branchKeyForMatch(candidate);
                return !targetBranchKey || !sourceBranchKey || sourceBranchKey === targetBranchKey;
            })
            .sort((a, b) => Number(b.stageId?.number || 0) - Number(a.stageId?.number || 0));
        const fallbackCandidates = sourceCandidates.length ? sourceCandidates : sourceMatches
            .filter((candidate) => {
                if (normalizeMatchCode(candidate.name) !== sourceCode) return false;
                const sourceStageNumber = Number(candidate.stageId?.number || 0);
                return !targetStageNumber || sourceStageNumber < targetStageNumber;
            })
            .sort((a, b) => Number(b.stageId?.number || 0) - Number(a.stageId?.number || 0));
        const source = fallbackCandidates[0];
        if (source) assignSlot(index, source, sourceCode);
    });

    if (updated) {
        match.participants = participants;
        match.markModified('participants');
        await match.save({ session });
        console.info('[match.complete] resolved dependency participants before completion', {
            matchId: String(match._id),
            matchCode: match.name,
            participants: participants.map((participant) => String(participant?._id || participant || '')),
        });
    }
    return { updated, participants };
};

const matchStageId = (match) => String(match.stageId?._id || match.stageId || '');

const matchIdentityKey = (match) => {
    const stageId = matchStageId(match);
    const code = String(match.name || '').trim().toUpperCase();
    return stageId && code ? `${stageId}:${code}` : '';
};

const matchCanonicalPriority = (match) => {
    let score = 0;
    if (['completed', 'walkover', 'forfeited'].includes(match.status)) score += 1000;
    if (match.status === 'live') score += 900;
    if (match.scheduledTime) score += 600;
    if (match.courtId) score += 200;
    if (Array.isArray(match.refereeIds) && match.refereeIds.length > 0) score += 100;
    if (match.matchResultId) score += 50;
    if (Array.isArray(match.participants)) {
        score += match.participants.filter((participant) => {
            const value = participant?.name || participant?._id || participant;
            return String(value || '').trim();
        }).length * 20;
    }
    return score;
};

const canonicalizeDuplicateMatches = (matches) => {
    const chosen = new Map();
    const passthrough = [];
    for (const match of matches) {
        const key = matchIdentityKey(match);
        if (!key) {
            passthrough.push(match);
            continue;
        }
        const current = chosen.get(key);
        if (!current || matchCanonicalPriority(match) > matchCanonicalPriority(current)) {
            chosen.set(key, match);
        }
    }
    return [...passthrough, ...chosen.values()];
};

const populateMatchReadQuery = (query) => query
    .populate('winnerParticipantId', 'name logo')
    .populate('participants', 'name logo')
    .populate('groupId', 'name')
    .populate('bracketId', 'name type')
    .populate('stageId', 'name number')
    .populate('courtId', 'name status')
    .populate('refereeIds', 'name qualification experience status')
    .populate('matchResultId')
    .populate({
        path: 'previousMatches.matchId',
        select: 'name formatNodeId winnerParticipantId status',
        populate: { path: 'winnerParticipantId', select: 'name logo' },
    });

const syncKnockoutFinalResult = async (match, session) => {
    if (match.status !== 'completed' || !match.winnerParticipantId) return null;
    const bracket = await Bracket.findById(match.bracketId).select('type name').session(session);
    if (!bracket || bracket.type !== 'knockout') return null;

    const branchKey = branchKeyForMatch(match);
    const knockoutMatches = await Match.find({ tournamentItemId: match.tournamentItemId })
        .populate('stageId', 'number name')
        .populate('bracketId', 'type name')
        .session(session);
    const currentStage = await StageRule.findById(match.stageId?._id || match.stageId).select('number name').session(session);
    const branchMatches = knockoutMatches.filter((item) => {
        const itemBracket = item.bracketId;
        return String(itemBracket?.type || '') === 'knockout' && branchKeyForMatch(item) === branchKey;
    });
    if (branchMatches.length === 0) return null;

    const finalStageNumber = Math.max(...branchMatches.map((item) => Number(item.stageId?.number || 0)));
    if (Number(currentStage?.number || 0) !== finalStageNumber) return null;

    const participants = (match.participants || []).map((participant) => participant?._id || participant).filter(Boolean);
    const winnerId = String(match.winnerParticipantId);
    const runnerUpId = participants.find((participant) => String(participant) !== winnerId);
    if (!runnerUpId) return null;

    const result = await MatchResult.findOne({ matchId: match._id }).session(session);
    const details = result?.details || {};
    const finalScore = {
        teamA: Number(details.teamA ?? 0),
        teamB: Number(details.teamB ?? 0),
    };

    const record = await KnockoutResult.findOneAndUpdate(
        { tournamentItemId: match.tournamentItemId, finalMatchId: match._id },
        {
            tournamentItemId: match.tournamentItemId,
            branchId: match.bracketId?._id || match.bracketId || null,
            branchKey,
            branchName: bracket.name || '',
            finalMatchId: match._id,
            finalStageId: currentStage?._id || match.stageId?._id || match.stageId,
            championParticipantId: match.winnerParticipantId,
            runnerUpParticipantId: runnerUpId,
            finalScore,
            determinedAt: new Date(),
        },
        { upsert: true, new: true, session },
    );
    console.info('[knockout.final] result synced', {
        tournamentItemId: String(match.tournamentItemId),
        finalMatchId: String(match._id),
        branchKey,
        championParticipantId: String(match.winnerParticipantId),
        runnerUpParticipantId: String(runnerUpId),
    });
    return record;
};

const syncKnockoutParticipantsFromStandings = async (tournamentItemId, session) => {
    const rows = await Standing.find({ tournamentItemId })
        .populate('groupId', 'name')
        .sort({ stageId: 1, groupId: 1, rank: 1 })
        .session(session);
    const participantByKey = new Map();
    const allRankKeys = new Set();
    const groupIds = [...new Set(rows.map((row) => String(row.groupId?._id || row.groupId || '')).filter(Boolean))];
    const groupCompletion = new Map();
    if (groupIds.length) {
        const groupMatches = await Match.find({ tournamentItemId, groupId: { $in: groupIds } })
            .select('groupId status')
            .lean()
            .session(session);
        const totals = new Map();
        const completed = new Map();
        groupMatches.forEach((match) => {
            const groupId = String(match.groupId || '');
            totals.set(groupId, (totals.get(groupId) || 0) + 1);
            if (COMPLETE_STATUSES.includes(match.status)) {
                completed.set(groupId, (completed.get(groupId) || 0) + 1);
            }
        });
        groupIds.forEach((groupId) => {
            groupCompletion.set(groupId, (totals.get(groupId) || 0) > 0 && totals.get(groupId) === (completed.get(groupId) || 0));
        });
    }

    rows.forEach((row) => {
        const groupName = row.groupId?.name || '';
        const groupId = String(row.groupId?._id || row.groupId || '');
        if (!groupName || !row.rank || !row.teamOrPlayerId) return;
        const key = rankKeyForGroup(groupName, row.rank);
        allRankKeys.add(key);
        if (!groupCompletion.get(groupId)) return;
        participantByKey.set(key, row.teamOrPlayerId);
    });
    if (allRankKeys.size === 0) {
        console.info('[standings.syncKnockout] skipped: no rank keys', { tournamentItemId: String(tournamentItemId) });
        return { updated: 0, keys: 0 };
    }

    const matches = await Match.find({
        tournamentItemId,
        status: { $nin: ['completed', 'walkover', 'forfeited'] },
    }).session(session);
    let updated = 0;
    let cleared = 0;
    for (const match of matches) {
        const labels = Array.isArray(match.formatSlotLabels) ? match.formatSlotLabels : [];
        if (labels.length === 0) continue;
        const slotKeys = labels.slice(0, 2).map((label) => normalizeRankSlotKey(label));
        const rankSlotKeys = slotKeys.filter((key) => allRankKeys.has(key));
        if (rankSlotKeys.length === 0) continue;
        const unresolved = rankSlotKeys.some((key) => !participantByKey.has(key));
        if (unresolved) {
            if (!Array.isArray(match.participants) || match.participants.length === 0) continue;
            match.participants = [];
            await match.save({ session });
            cleared++;
            console.info('[standings.syncKnockout] cleared premature participants', {
                matchId: String(match._id),
                name: match.name,
                formatSlotLabels: labels,
            });
            continue;
        }
        const nextParticipants = slotKeys.map((key) => participantByKey.get(key)).filter(Boolean);
        const currentParticipants = (match.participants || []).map((participant) => String(participant));
        if (
            nextParticipants.length === currentParticipants.length
            && nextParticipants.every((participant, index) => String(participant) === currentParticipants[index])
        ) {
            continue;
        }
        match.participants = nextParticipants;
        await match.save({ session });
        updated++;
        console.info('[standings.syncKnockout] match participants updated', {
            matchId: String(match._id),
            name: match.name,
            formatSlotLabels: labels,
            participantCount: match.participants.length,
        });
    }
    console.info('[standings.syncKnockout] completed', {
        tournamentItemId: String(tournamentItemId),
        rankKeys: participantByKey.size,
        updatedMatches: updated,
        clearedMatches: cleared,
    });
    return { updated, cleared, keys: participantByKey.size, pendingKeys: allRankKeys.size - participantByKey.size };
};

const rebuildStageStandings = async (sourceMatch, context, session) => {
    const sourceBracket = sourceMatch.bracketId
        ? await Bracket.findById(sourceMatch.bracketId).select('type name').session(session)
        : null;
    if (sourceBracket && sourceBracket.type !== 'group') {
        console.info('[standings.rebuild] skipped: non-group bracket', {
            tournamentItemId: String(sourceMatch.tournamentItemId),
            stageId: String(sourceMatch.stageId || ''),
            bracketId: String(sourceMatch.bracketId || ''),
            bracketType: sourceBracket.type,
        });
        return { rows: 0, groups: 0, skipped: 'nonGroupBracket' };
    }
    const item = await TournamentItem.findById(sourceMatch.tournamentItemId).select('tournamentId').session(session);
    const standingTournamentId = item?.tournamentId || sourceMatch.tournamentItemId;
    if (!standingTournamentId) {
        console.warn('[standings.rebuild] skipped: missing tournament reference', {
            tournamentItemId: String(sourceMatch.tournamentItemId || ''),
            stageId: String(sourceMatch.stageId || ''),
        });
        return { rows: 0, groups: 0, skipped: 'missingTournamentReference' };
    }
    console.info('[standings.rebuild] start', {
        tournamentItemId: String(sourceMatch.tournamentItemId),
        stageId: String(sourceMatch.stageId),
        scoring: context.scoring || {},
        points: {
            win: getStandingPoints('win', context),
            draw: getStandingPoints('draw', context),
            loss: getStandingPoints('loss', context),
        },
    });

    const matches = await Match.find({
        tournamentItemId: sourceMatch.tournamentItemId,
        stageId: sourceMatch.stageId,
    })
        .populate('participants', 'name type')
        .populate('matchResultId')
        .session(session);

    const rows = new Map();
    const ensureRow = (participant, groupId) => {
        const participantId = String(participant?._id || participant || '');
        if (!participantId) return null;
        const key = `${participantId}:${groupId || ''}`;
        if (!rows.has(key)) {
            rows.set(key, {
                participantId,
                name: participant?.name || '',
                participantType: participant?.type || 'team',
                groupId: groupId || null,
                played: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                goalDifference: 0,
                points: 0,
            });
        }
        return rows.get(key);
    };

    matches.forEach((match) => {
        (match.participants || []).forEach((participant) => ensureRow(participant, match.groupId));
    });

    for (const match of matches) {
        if (!['completed', 'walkover', 'forfeited'].includes(match.status)) continue;
        const participants = match.participants || [];
        if (participants.length < 2 || !match.matchResultId) continue;
        const teamA = participants[0];
        const teamB = participants[1];
        const rowA = ensureRow(teamA, match.groupId);
        const rowB = ensureRow(teamB, match.groupId);
        if (!rowA || !rowB) continue;

        const details = match.matchResultId.details || {};
        const winnerId = String(match.winnerParticipantId || '');
        const scoreA = Number(details.teamA ?? (winnerId === String(teamA._id) ? match.matchResultId.winnerScore : match.matchResultId.loserScore) ?? 0);
        const scoreB = Number(details.teamB ?? (winnerId === String(teamB._id) ? match.matchResultId.winnerScore : match.matchResultId.loserScore) ?? 0);
        const isDraw = Boolean(match.matchResultId.isDraw);

        rowA.played += 1;
        rowB.played += 1;
        rowA.goalsFor += scoreA;
        rowA.goalsAgainst += scoreB;
        rowB.goalsFor += scoreB;
        rowB.goalsAgainst += scoreA;

        if (isDraw || scoreA === scoreB) {
            rowA.draws += 1;
            rowB.draws += 1;
            rowA.points += getStandingPoints('draw', context);
            rowB.points += getStandingPoints('draw', context);
        } else if (winnerId === String(teamA._id)) {
            rowA.wins += 1;
            rowB.losses += 1;
            rowA.points += getStandingPoints('win', context);
            rowB.points += getStandingPoints('loss', context);
        } else {
            rowB.wins += 1;
            rowA.losses += 1;
            rowB.points += getStandingPoints('win', context);
            rowA.points += getStandingPoints('loss', context);
        }
        rowA.goalDifference = rowA.goalsFor - rowA.goalsAgainst;
        rowB.goalDifference = rowB.goalsFor - rowB.goalsAgainst;
    }

    const sortedRows = Array.from(rows.values()).sort((a, b) => compareStandingRows(a, b, context.rankingCriteria));
    await Standing.deleteMany({ tournamentItemId: sourceMatch.tournamentItemId, stageId: sourceMatch.stageId }).session(session);
    if (sortedRows.length === 0) {
        console.info('[standings.rebuild] no rows generated', {
            tournamentItemId: String(sourceMatch.tournamentItemId),
            stageId: String(sourceMatch.stageId),
        });
        return { rows: 0, groups: 0 };
    }

    const rankByGroup = new Map();
    const insertedRows = await Standing.insertMany(sortedRows.map((row) => {
        const groupKey = String(row.groupId || 'overall');
        const nextRank = (rankByGroup.get(groupKey) || 0) + 1;
        rankByGroup.set(groupKey, nextRank);
        return {
            tournamentId: standingTournamentId,
        tournamentItemId: sourceMatch.tournamentItemId,
        teamOrPlayerId: row.participantId,
        participantType: row.participantType,
        bracketid: sourceMatch.bracketId || null,
        stageId: sourceMatch.stageId,
        groupId: row.groupId,
        played: row.played,
        wins: row.wins,
        draws: row.draws,
        losses: row.losses,
        goalsFor: row.goalsFor,
        goalsAgainst: row.goalsAgainst,
        goalDifference: row.goalDifference,
        points: row.points,
        rank: nextRank,
        customStats: {
            rankingCriteria: context.rankingCriteria || [],
            scoring: context.scoring || {},
        },
        };
    }), { session });
    console.info('[standings.rebuild] rows saved', {
        tournamentItemId: String(sourceMatch.tournamentItemId),
        stageId: String(sourceMatch.stageId),
        rows: insertedRows.length,
        groups: rankByGroup.size,
    });
    return { rows: insertedRows.length, groups: rankByGroup.size };
};

const generateRoundRobinPairs = (teamIds) => {
    const teams = [...teamIds];
    if (teams.length % 2 === 1) teams.push(null);
    const rounds = [];
    const count = teams.length;
    const half = count / 2;
    for (let round = 0; round < count - 1; round++) {
        const pairs = [];
        for (let index = 0; index < half; index++) {
            const teamA = teams[index];
            const teamB = teams[count - 1 - index];
            if (teamA && teamB) pairs.push([teamA, teamB]);
        }
        rounds.push(pairs);
        const last = teams.pop();
        teams.splice(1, 0, last);
    }
    return rounds;
};

const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60 * 1000);

const buildScheduledTime = ({ baseStart, matchIndex, courtCount, matchMinutes, gapMinutes }) => {
    if (!baseStart || Number.isNaN(baseStart.getTime()) || courtCount <= 0) return undefined;
    const slotIndex = Math.floor(matchIndex / courtCount);
    return addMinutes(baseStart, slotIndex * (matchMinutes + gapMinutes));
};

const sameMinuteKey = (value) => {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return '';
    date.setSeconds(0, 0);
    return date.toISOString();
};

const SCHEDULE_MATCH_MINUTES = 30;
const scheduleWindow = (value) => {
    const start = value ? new Date(value) : null;
    if (!start || Number.isNaN(start.getTime())) return null;
    return {
        start,
        end: new Date(start.getTime() + SCHEDULE_MATCH_MINUTES * 60 * 1000),
    };
};

const overlapsScheduleWindow = (a, b) => a && b && a.start < b.end && b.start < a.end;

const firstFiniteNumber = (...values) => {
    for (const value of values) {
        const number = Number(value);
        if (Number.isFinite(number) && number >= 0) return number;
    }
    return undefined;
};

const getScheduleTiming = async (match, context, session) => {
    const item = await TournamentItem.findById(match.tournamentItemId)
        .select('competitionFormat')
        .lean()
        .session(session);
    const config = item?.competitionFormat?.config || {};
    const stage = context?.formatStage || {};
    const schedule = {
        ...(config.schedule || {}),
        ...(config.timing || {}),
        ...(stage.schedule || {}),
        ...(stage.timing || {}),
    };
    return {
        matchMinutes: firstFiniteNumber(
            match.matchMinutes,
            stage.matchMinutes,
            stage.durationMinutes,
            stage.input?.matchMinutes,
            stage.input?.durationMinutes,
            schedule.matchMinutes,
            schedule.durationMinutes,
            config.matchMinutes,
            config.durationMinutes,
            SCHEDULE_MATCH_MINUTES,
        ),
        restMinutes: firstFiniteNumber(
            stage.restMinutes,
            stage.breakMinutes,
            stage.minRestMinutes,
            stage.gapMinutes,
            schedule.restMinutes,
            schedule.breakMinutes,
            schedule.minRestMinutes,
            schedule.gapMinutes,
            config.restMinutes,
            config.breakMinutes,
            config.minRestMinutes,
            config.gapMinutes,
            0,
        ),
    };
};

const resolveScheduleDependencyMatches = async (match, session) => {
    const dependencies = new Map();
    const addMatches = (items = []) => {
        items.forEach((item) => {
            if (!item?._id || String(item._id) === String(match._id)) return;
            dependencies.set(String(item._id), item);
        });
    };

    const previousIds = (match.previousMatches || []).map((entry) => entry.matchId).filter(Boolean);
    if (previousIds.length) {
        addMatches(await Match.find({ _id: { $in: previousIds } })
            .select('name scheduledTime stageId tournamentItemId')
            .session(session));
    }

    const labels = (Array.isArray(match.formatSlotLabels) ? match.formatSlotLabels : [])
        .slice(0, 2)
        .map((label) => String(label || '').trim())
        .filter(Boolean);
    if (labels.length === 0) return Array.from(dependencies.values());

    const groups = await Group.find({ tournamentItemId: match.tournamentItemId })
        .select('name')
        .lean()
        .session(session);
    const dependentGroupIds = [];
    const normalizedLabels = labels.map((label) => normalizeRankSlotKey(label));
    groups.forEach((group) => {
        const groupKey = normalizeRankKey(group.name);
        if (!groupKey) return;
        if (normalizedLabels.some((label) => new RegExp(`^${groupKey}\\d+$`).test(label))) {
            dependentGroupIds.push(group._id);
        }
    });
    if (dependentGroupIds.length) {
        addMatches(await Match.find({ tournamentItemId: match.tournamentItemId, groupId: { $in: dependentGroupIds } })
            .select('name scheduledTime stageId tournamentItemId')
            .session(session));
    }

    const matchCodeLabels = labels.filter((label) => /^M\d+$/i.test(label));
    if (matchCodeLabels.length) {
        addMatches(await Match.find({ tournamentItemId: match.tournamentItemId, name: { $in: matchCodeLabels } })
            .select('name scheduledTime stageId tournamentItemId')
            .session(session));
    }

    return Array.from(dependencies.values());
};

const assertNoScheduleConflicts = async (match, session) => {
    const currentWindow = scheduleWindow(match.scheduledTime);
    if (!currentWindow) return { ok: true };
    const courtId = match.courtId?._id || match.courtId;
    const refereeIds = (match.refereeIds || []).map((id) => id?.toString()).filter(Boolean);
    if (!courtId && refereeIds.length === 0) return { ok: true };

    const rangeStart = new Date(currentWindow.start.getTime() - SCHEDULE_MATCH_MINUTES * 60 * 1000);
    const rangeEnd = new Date(currentWindow.end.getTime());
    const candidates = await Match.find({
        _id: { $ne: match._id },
        tournamentItemId: match.tournamentItemId,
        scheduledTime: { $gte: rangeStart, $lt: rangeEnd },
        $or: [
            ...(courtId ? [{ courtId }] : []),
            ...(refereeIds.length ? [{ refereeIds: { $in: refereeIds } }] : []),
        ],
    })
        .populate('courtId', 'name')
        .populate('refereeIds', 'name')
        .session(session);

    for (const other of candidates) {
        const otherWindow = scheduleWindow(other.scheduledTime);
        if (!overlapsScheduleWindow(currentWindow, otherWindow)) continue;
        if (courtId && String(other.courtId?._id || other.courtId) === String(courtId)) {
            const start = other.scheduledTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            const end = new Date(other.scheduledTime.getTime() + SCHEDULE_MATCH_MINUTES * 60 * 1000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            return {
                ok: false,
                status: 409,
                title: 'Trung lịch thi đấu',
                message: `${other.courtId?.name || 'Sân thi đấu'} đã có trận ${other.name} từ ${start} đến ${end}. Vui lòng chọn thời gian hoặc sân khác.`,
            };
        }
        const duplicatedReferee = (other.refereeIds || []).find((referee) => refereeIds.includes(String(referee?._id || referee)));
        if (duplicatedReferee) {
            return {
                ok: false,
                status: 409,
                title: 'Trùng lịch trọng tài',
                message: `${duplicatedReferee.name || 'Trọng tài'} da duoc phan cong o trận ${other.name} trong cung khung gio. Vui lòng chon trọng tài khac.`,
            };
        }
    }
    return { ok: true };
};

const assertMatchReadyForScheduling = async (match, session, schedulingNow = false) => {
    if (!schedulingNow && !match.scheduledTime && !match.courtId) return { ok: true };
    const bracket = match.bracketId ? await Bracket.findById(match.bracketId).select('type name').session(session) : null;
    const context = await getStageRuleContext(match, session);
    const sourceType = String(context.formatStage?.sourceType || '').toUpperCase();
    const isIndependentStage = ['REGISTRATION', 'PARTICIPANT'].includes(sourceType);
    const bracketType = String(bracket?.type || '').toLowerCase();
    const isKnockout = bracketType && bracketType !== 'group';
    const participantCount = (match.participants || []).filter(Boolean).length;
    const dependencies = await resolveScheduleDependencyMatches(match, session);
    const isDependentMatch = dependencies.length > 0 || sourceType === 'PREVIOUS_STAGE' || isKnockout;

    if (isDependentMatch && dependencies.length === 0 && participantCount < 2 && !isIndependentStage) {
        return {
            ok: false,
            status: 409,
            title: 'Chưa đủ dieu kien xếp lịch',
            message: 'Trận này chưa có đường đi/slot nguồn hợp lệ để kiểm tra thứ tự lịch đấu. Hãy kiểm tra lại cấu hình thể thức.',
        };
    }

    if (!match.scheduledTime || dependencies.length === 0) return { ok: true };

    const unscheduledSources = dependencies.filter((source) => !source.scheduledTime);
    if (unscheduledSources.length) {
        return {
            ok: false,
            status: 409,
            title: 'Chưa đủ dieu kien xếp lịch',
            message: 'Trận nguồn chưa có thời gian thi đấu nên chưa thể kiểm tra thứ tự lịch đấu.',
        };
    }

    let latestAllowedStart = null;
    for (const source of dependencies) {
        const sourceContext = await getStageRuleContext(source, session);
        const timing = await getScheduleTiming(source, sourceContext, session);
        const sourceEnd = new Date(source.scheduledTime.getTime() + (timing.matchMinutes + timing.restMinutes) * 60 * 1000);
        if (!latestAllowedStart || sourceEnd > latestAllowedStart) latestAllowedStart = sourceEnd;
    }
    if (latestAllowedStart && match.scheduledTime < latestAllowedStart) {
        return {
            ok: false,
            status: 409,
            title: 'Thời gian trận đấu khong hop le',
            message: `Thời gian trận đấu phải sau các trận ở stage trước. Trận nguồn chưa kết thúc trước thời gian bắt đầu trận này (${latestAllowedStart.toISOString()}).`,
        };
    }

    return { ok: true };
};

const findScheduleConflicts = (matches) => {
    const seen = new Map();
    const conflicts = [];
    for (const match of matches) {
        const courtId = match.courtId?._id || match.courtId;
        const timeKey = sameMinuteKey(match.scheduledTime);
        if (!courtId || !timeKey) continue;
        const key = `${courtId}:${timeKey}`;
        if (seen.has(key)) {
            conflicts.push({
                courtId: courtId.toString(),
                scheduledTime: timeKey,
                matchIds: [seen.get(key).toString(), match._id.toString()],
            });
        } else {
            seen.set(key, match._id);
        }
    }
    return conflicts;
};

export const generateGroupStageMatches = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const userId = req.user._id;
        const {
            tournamentItemId,
            stageOrder = 1,
            stageName = 'Vòng bảng',
            groups = [],
            startAt,
            matchMinutes = 30,
            gapMinutes = 10,
        } = req.body;

        if (!tournamentItemId || !Array.isArray(groups) || groups.length === 0) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Missing tournamentItemId or groups' });
        }

        const { isAdmin, isOwner } = await checkTournamentItemPermission(tournamentItemId, userId);
        if (!isAdmin && !isOwner) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: 'Permission denied' });
        }

        const assignedTeamIds = groups.flatMap(group => Array.isArray(group.teamIds) ? group.teamIds : []);
        if (assignedTeamIds.length < 2) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Need at least two teams to generate matches' });
        }

        const uniqueTeamIds = [...new Set(assignedTeamIds.map(String))];
        if (uniqueTeamIds.length !== assignedTeamIds.length) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'A team can only be assigned to one slot' });
        }

        const participants = await Participant.find({
            _id: { $in: uniqueTeamIds },
            tournamentItemId,
            type: 'team',
            registrationStatus: { $nin: ['rejected', 'suspended'] },
        }).session(session);

        if (participants.length !== uniqueTeamIds.length) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Invalid team assignment' });
        }

        let stage = await StageRule.findOne({ tournamentItemId, number: Number(stageOrder) }).session(session);
        if (stage) {
            const completedMatches = await Match.countDocuments({ stageId: stage._id, status: 'completed' }).session(session);
            if (completedMatches > 0) {
                await session.abortTransaction();
                return res.status(400).json({ success: false, message: 'Cannot regenerate a stage that has completed matches' });
            }
            const existingBrackets = await Bracket.find({ stageId: stage._id }).session(session);
            await Match.deleteMany({ stageId: stage._id }).session(session);
            await Group.deleteMany({ stageRuleId: stage._id }).session(session);
            await Bracket.deleteMany({ _id: { $in: existingBrackets.map(bracket => bracket._id) } }).session(session);
            stage.name = stageName;
            stage.totalTeamsIn = uniqueTeamIds.length;
            stage.hasBracket = true;
            await stage.save({ session });
        } else {
            stage = await StageRule.create([{
                tournamentItemId,
                number: Number(stageOrder),
                name: stageName,
                totalTeamsIn: uniqueTeamIds.length,
                hasBracket: true,
                status: Number(stageOrder) === 1 ? 'actived' : 'pending',
            }], { session }).then(items => items[0]);
            await TournamentItem.findByIdAndUpdate(
                tournamentItemId,
                { $addToSet: { 'structure.stage': stage._id } },
                { session },
            );
        }

        const bracket = await Bracket.create([{
            TournamentItem: tournamentItemId,
            stageId: stage._id,
            type: 'group',
            name: stageName,
            totalTeamsIn: uniqueTeamIds.length,
            group: [],
        }], { session }).then(items => items[0]);

        const courts = await Court.find({ tournamentItemId, status: { $ne: 'inactived' } }).sort({ createdAt: 1 }).session(session);
        const baseStart = startAt ? new Date(startAt) : null;
        const courtCount = Math.max(1, courts.length);
        let matchIndex = 0;
        const createdMatches = [];

        for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
            const groupData = groups[groupIndex];
            const teamIds = (Array.isArray(groupData.teamIds) ? groupData.teamIds : []).map(String).filter(Boolean);
            const group = await Group.create([{
                name: groupData.name || `Bảng ${String.fromCharCode(65 + groupIndex)}`,
                tournamentItemId,
                bracketId: bracket._id,
                sport: String(groupData.sport || 'Pickleball'),
                stageRuleId: stage._id,
                status: 'pending',
                matches: [],
            }], { session }).then(items => items[0]);
            bracket.group.push(group._id);

            const groupMatches = [];
            const rounds = generateRoundRobinPairs(teamIds);
            for (let roundIndex = 0; roundIndex < rounds.length; roundIndex++) {
                for (const [teamA, teamB] of rounds[roundIndex]) {
                    const court = courts.length ? courts[matchIndex % courts.length] : null;
                    const scheduledTime = buildScheduledTime({
                        baseStart,
                        matchIndex,
                        courtCount,
                        matchMinutes: Number(matchMinutes) || 30,
                        gapMinutes: Number(gapMinutes) || 10,
                    });
                    const match = await Match.create([{
                        tournamentItemId,
                        stageId: stage._id,
                        bracketId: bracket._id,
                        groupId: group._id,
                        name: `${group.name} - Match ${groupMatches.length + 1}`,
                        round: roundIndex + 1,
                        participants: [teamA, teamB],
                        scheduledTime,
                        courtId: court?._id,
                        status: 'pending',
                        previousMatches: [],
                        nextMatchId: null,
                        winnerParticipantId: null,
                        matchResultId: null,
                    }], { session }).then(items => items[0]);
                    groupMatches.push(match._id);
                    createdMatches.push(match);
                    matchIndex++;
                }
            }
            group.matches = groupMatches;
            await group.save({ session });
        }

        await bracket.save({ session });
        await session.commitTransaction();
        return res.status(201).json({
            success: true,
            message: 'Group stage matches generated',
            data: { stage, bracket, matches: createdMatches },
        });
    } catch (error) {
        await session.abortTransaction();
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

export const getMatchesByTournamentItem = async (req, res) => {
    try {
        await syncLiveMatches();
        const { tournamentItemId } = req.params;
        await syncCompletedKnockoutAdvancement(tournamentItemId);
        const matches = await populateMatchReadQuery(Match.find({ tournamentItemId }))
            .sort({ round: 1, 'previousMatches.matchId': 1 });
        return res.json({ success: true, data: canonicalizeDuplicateMatches(matches) });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getPublishedMatchesByTournamentItem = async (req, res) => {
    try {
        await syncLiveMatches();
        const { tournamentItemId } = req.params;
        await syncCompletedKnockoutAdvancement(tournamentItemId);
        const matches = await populateMatchReadQuery(Match.find({
            tournamentItemId,
            scheduleStatus: 'published',
            scheduledTime: { $ne: null },
        }))
            .sort({ scheduledTime: 1, scheduleOrder: 1, round: 1 });
        return res.json({ success: true, data: canonicalizeDuplicateMatches(matches) });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getKnockoutBracketByTournamentItem = async (req, res) => {
    try {
        await syncLiveMatches();
        const { tournamentItemId } = req.params;
        await syncCompletedKnockoutAdvancement(tournamentItemId);
        const matches = await populateMatchReadQuery(Match.find({ tournamentItemId }))
            .sort({ 'stageId.number': 1, round: 1, scheduleOrder: 1, createdAt: 1 });
        const knockoutMatches = canonicalizeDuplicateMatches(matches.filter((match) => String(match.bracketId?.type || '') === 'knockout'));
        const finalStageByBranch = new Map();
        knockoutMatches.forEach((match) => {
            const branchKey = branchKeyForMatch(match);
            const stageNumber = Number(match.stageId?.number || 0);
            finalStageByBranch.set(branchKey, Math.max(finalStageByBranch.get(branchKey) || 0, stageNumber));
        });
        const results = await KnockoutResult.find({ tournamentItemId })
            .populate('championParticipantId', 'name logo')
            .populate('runnerUpParticipantId', 'name logo')
            .populate('finalMatchId', 'name status')
            .populate('finalStageId', 'name number')
            .lean();
        return res.json({
            success: true,
            data: {
                stages: [...new Map(knockoutMatches.map((match) => [String(match.stageId?._id || match.stageId), match.stageId])).values()],
                matches: knockoutMatches.map((match) => ({
                    ...match.toObject(),
                    branchKey: branchKeyForMatch(match),
                    isFinalStageMatch: Number(match.stageId?.number || 0) === (finalStageByBranch.get(branchKeyForMatch(match)) || 0),
                })),
                achievements: results,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getPublicStandingsByTournamentItem = async (req, res) => {
    try {
        const { tournamentItemId } = req.params;
        let rows = await Standing.find({ tournamentItemId })
            .populate('stageId', 'name number')
            .populate('groupId', 'name')
            .populate('bracketid', 'type name')
            .sort({ stageId: 1, groupId: 1, rank: 1 })
            .lean();
        rows = rows.filter((row) => row.groupId || row.bracketid?.type === 'group');
        const completedMatches = await Match.find({
            tournamentItemId,
            status: { $in: ['completed', 'walkover', 'forfeited'] },
        })
            .populate('bracketId', 'type')
            .select('_id stageId tournamentItemId bracketId')
            .lean();
        const completedGroupMatches = completedMatches.filter((match) => match.bracketId?.type === 'group' || !match.bracketId);
        const totalPlayedInRows = rows.reduce((sum, row) => sum + Number(row.played || 0), 0);
        const hasZeroPointWinner = rows.some((row) => Number(row.wins || 0) > 0 && Number(row.points || 0) <= 0);
        if (completedGroupMatches.length > 0 && (totalPlayedInRows < completedGroupMatches.length * 2 || hasZeroPointWinner)) {
            console.info('[standings.public] stale rows detected, rebuilding before response', {
                tournamentItemId: String(tournamentItemId),
                completedMatches: completedGroupMatches.length,
                totalPlayedInRows,
                hasZeroPointWinner,
            });
            const stageIds = [...new Set(completedGroupMatches.map((match) => String(match.stageId)).filter(Boolean))];
            for (const stageId of stageIds) {
                const sourceMatch = await Match.findOne({
                    tournamentItemId,
                    stageId,
                    status: { $in: ['completed', 'walkover', 'forfeited'] },
                });
                if (!sourceMatch) continue;
                const context = await getStageRuleContext(sourceMatch);
                await rebuildStageStandings(sourceMatch, context);
            }
            await syncKnockoutParticipantsFromStandings(tournamentItemId);
            rows = await Standing.find({ tournamentItemId })
                .populate('stageId', 'name number')
                .populate('groupId', 'name')
                .populate('bracketid', 'type name')
                .sort({ stageId: 1, groupId: 1, rank: 1 })
                .lean();
            rows = rows.filter((row) => row.groupId || row.bracketid?.type === 'group');
        }
        const participantIds = rows.map((row) => row.teamOrPlayerId).filter(Boolean);
        const participants = await Participant.find({ _id: { $in: participantIds } }).select('name logo type').lean();
        const participantById = new Map(participants.map((participant) => [participant._id.toString(), participant]));
        const data = rows.map((row) => {
            const participant = participantById.get(String(row.teamOrPlayerId));
            return {
                ...row,
                participant: participant ? {
                    _id: participant._id,
                    name: participant.name,
                    logo: participant.logo || '',
                    type: participant.type,
                } : null,
            };
        });
        return res.json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getMatchesByStage = async (req, res) => {
    try {
        await syncLiveMatches();
        const { stageId } = req.params;
        const stage = await StageRule.findById(stageId).select('tournamentItemId');
        if (stage?.tournamentItemId) {
            await syncCompletedKnockoutAdvancement(stage.tournamentItemId);
        }
        const matches = await populateMatchReadQuery(Match.find({ stageId }))
            .sort({ round: 1, 'previousMatches.matchId': 1 });
        return res.json({ success: true, data: matches });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getMatchesByBracket = async (req, res) => {
    try {
        await syncLiveMatches();
        const { bracketId } = req.params;
        const matches = await populateMatchReadQuery(Match.find({ bracketId }))
            .sort({ round: 1, 'previousMatches.matchId': 1 });
        return res.json({ success: true, data: matches });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getMatchesByGroup = async (req, res) => {
    try {
        await syncLiveMatches();
        const { groupId } = req.params;
        const matches = await populateMatchReadQuery(Match.find({ groupId }))
            .sort({ round: 1, 'previousMatches.matchId': 1 });
        return res.json({ success: true, data: matches });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getMatchById = async (req, res) => {
    try {
        await syncLiveMatches();
        const match = await Match.findById(req.params.id)
            .populate('winnerParticipantId', 'name logo')
            .populate('participants', 'name logo')
            .populate('previousMatches.matchId', 'name winnerParticipantId status')
            .populate('nextMatchId', 'name')
            .populate('nextLoserMatchId', 'name')
            .populate('courtId', 'name status')
            .populate('refereeIds', 'name qualification experience status')
            .populate('matchResultId');
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
        const { scheduledTime, courtId, refereeIds, status, scheduleOrder, scheduleStatus, winnerParticipantId, participantScores } = req.body;

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
        if (scheduledTime !== undefined) match.scheduledTime = scheduledTime ? new Date(scheduledTime) : null;
        if (courtId !== undefined) match.courtId = courtId || null;
        if (Array.isArray(refereeIds)) {
            const cleanedRefereeIds = refereeIds.filter(Boolean);
            if (cleanedRefereeIds.length > 0) {
                const validCount = await TournamentReferee.countDocuments({
                    _id: { $in: cleanedRefereeIds },
                    tournamentItemId: match.tournamentItemId,
                }).session(session);
                if (validCount !== cleanedRefereeIds.length) {
                    await session.abortTransaction();
                    return res.status(400).json({ success: false, message: 'Invalid refereeIds for this tournament item' });
                }
            }
            match.refereeIds = cleanedRefereeIds;
        }
        if (scheduleOrder !== undefined) match.scheduleOrder = Number(scheduleOrder) || 0;
        if (scheduleStatus && ['draft', 'published'].includes(scheduleStatus)) match.scheduleStatus = scheduleStatus;
        if (status) {
            if (!MATCH_STATUS_VALUES.includes(status)) {
                await session.abortTransaction();
                return res.status(400).json({ success: false, message: 'Invalid match status' });
            }
            if (match.status === 'completed' && status !== 'completed') {
                await session.abortTransaction();
                return res.status(409).json({ success: false, title: 'Trận đã hoan thanh', message: 'Không thể rollback trạng thái trận da hoan thanh tai man hinh nay.' });
            }
            if (status === 'completed' && !winnerParticipantId) {
                await session.abortTransaction();
                return res.status(400).json({ success: false, title: 'Can xac nhan kết quả', message: 'Muốn hoan thanh trận đấu, hay dung chuc nang Ket thuc & dong bo BXH de kiểm tra điểm theo thể thức.' });
            }
            match.status = status;
        }

        if (scheduledTime !== undefined || courtId !== undefined) {
            const readinessCheck = await assertMatchReadyForScheduling(match, session);
            if (!readinessCheck.ok) {
                await session.abortTransaction();
                return res.status(readinessCheck.status || 409).json({
                    success: false,
                    title: readinessCheck.title,
                    message: readinessCheck.message,
                });
            }
        }

        if (scheduledTime !== undefined || courtId !== undefined || Array.isArray(refereeIds)) {
            const conflictCheck = await assertNoScheduleConflicts(match, session);
            if (!conflictCheck.ok) {
                await session.abortTransaction();
                return res.status(conflictCheck.status || 409).json({
                    success: false,
                    title: conflictCheck.title,
                    message: conflictCheck.message,
                });
            }
        }

        // 5. Xử lý winnerParticipantId (nếu có)
        let knockoutAdvanceSync = null;
        if (winnerParticipantId) {
            if (match.status === 'completed') {
                await session.abortTransaction();
                return res.status(409).json({ success: false, title: 'Trận đã hoan thanh', message: 'Trận đã hoan thanh nen khong the nhap lai kết quả.' });
            }
            if (match.status !== 'live') {
                await session.abortTransaction();
                return res.status(409).json({ success: false, title: 'Chưa thể ket thuc tran', message: 'Chi co trận dang dien ra moi duoc phep xac nhan kết quả.' });
            }
            const participant = await Participant.findById(winnerParticipantId).session(session);
            if (!participant) {
                await session.abortTransaction();
                return res.status(400).json({ success: false, message: 'Invalid winnerParticipantId' });
            }

            await resolveMatchDependencyParticipants(match, session);

            // Kiểm tra eligibility
            const eligible = await getEligibleParticipants(match, session);
            const eligibleIds = eligible.map(p => p.toString());
            if (!eligibleIds.includes(winnerParticipantId.toString())) {
                await session.abortTransaction();
                return res.status(400).json({ success: false, message: 'Winner is not eligible for this match' });
            }

            const context = await getStageRuleContext(match, session);
            const scoreCheck = validateMatchScores({ match, winnerParticipantId, participantScores, context });
            if (!scoreCheck.ok) {
                await session.abortTransaction();
                return res.status(400).json({ success: false, title: scoreCheck.title, message: scoreCheck.message });
            }

            match.winnerParticipantId = participant._id;
            match.status = 'completed';

            // Tạo MatchResult
            const scores = {
                winner: scoreCheck.winnerScore,
                loser: scoreCheck.loserScore,
                isDraw: scoreCheck.isDraw,
                details: {
                    ...(participantScores?.details || {}),
                    scoringConfig: context.scoring || {},
                    rankingCriteria: context.rankingCriteria || []
                },
                statistics: participantScores?.statistics || {}
            };
            await createMatchResult(match, participant._id, null, scores, session);
            await match.save({ session });
            knockoutAdvanceSync = await propagateWinnerToDependentMatches(match, participant._id, session);
            await rebuildStageStandings(match, context, session);
            await syncKnockoutParticipantsFromStandings(match.tournamentItemId, session);
            await syncKnockoutFinalResult(match, session);
        }

        // 6. Lưu match
        await match.save({ session });

        // 7. Nếu match vừa hoàn thành và có nextMatchId, cập nhật next match
        await session.commitTransaction();
        return res.json({ success: true, data: match, sync: { knockoutAdvance: knockoutAdvanceSync } });
    } catch (error) {
        await session.abortTransaction();
        return res.status(error.status || 500).json({ success: false, title: error.title, message: error.clientMessage || error.message });
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

        const context = await getStageRuleContext(match, session);

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
        const knockoutAdvanceSync = await propagateWinnerToDependentMatches(match, winner, session);

        await session.commitTransaction();
        return res.json({ success: true, message: 'Auto result set', data: match, sync: { knockoutAdvance: knockoutAdvanceSync } });
    } catch (error) {
        await session.abortTransaction();
        return res.status(error.status || 500).json({ success: false, title: error.title, message: error.clientMessage || error.message });
    } finally {
        session.endSession();
    }
};

// ==================== HOÀN THÀNH MATCH ====================

export const updateLiveMatchScore = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        await syncLiveMatches();
        const { id } = req.params;
        const userId = req.user._id;
        const { participantScores = {} } = req.body;

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
            return res.status(409).json({
                success: false,
                title: 'Trận đã hoan thanh',
                message: 'Trận đã hoan thanh nen khong the cập nhật điểm tai man hinh nhap kết quả.',
            });
        }
        if (match.status !== 'live') {
            await session.abortTransaction();
            return res.status(409).json({
                success: false,
                title: 'Chưa thể nhap điểm',
                message: 'Chi co trận dang dien ra moi duoc phep nhap hoac cập nhật điểm.',
            });
        }

        await resolveMatchDependencyParticipants(match, session);

        const participantIds = (match.participants || [])
            .map((participant) => String(participant?._id || participant || ''))
            .filter(Boolean);
        if (participantIds.length < 2) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, title: 'Chưa đủ đội thi đấu', message: 'Trận đấu chua co du 2 doi hop le.' });
        }

        const result = await saveLiveMatchScore(match, participantScores, userId, session);
        await session.commitTransaction();
        return res.json({ success: true, data: { match, result }, sync: { standings: false, knockout: false } });
    } catch (error) {
        await session.abortTransaction();
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

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
            return res.status(409).json({
                success: false,
                title: 'Trận đã hoan thanh',
                message: 'Trận đã hoan thanh nen khong the nhap lai kết quả.',
            });
        }
        if (match.status !== 'live') {
            await session.abortTransaction();
            return res.status(409).json({
                success: false,
                title: 'Chưa thể ket thuc tran',
                message: 'Chi co trận dang dien ra moi duoc phep xac nhan kết quả.',
            });
        }

        const participant = await Participant.findById(winnerParticipantId).session(session);
        if (!participant) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Invalid participant' });
        }

        await resolveMatchDependencyParticipants(match, session);

        // Kiểm tra eligibility
        const eligible = await getEligibleParticipants(match, session);
        const eligibleIds = eligible.map(p => p.toString());
        if (!eligibleIds.includes(winnerParticipantId.toString())) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Winner is not eligible for this match' });
        }

        const context = await getStageRuleContext(match, session);
        const scoreCheck = validateMatchScores({ match, winnerParticipantId, participantScores, context });
        if (!scoreCheck.ok) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, title: scoreCheck.title, message: scoreCheck.message });
        }

        match.winnerParticipantId = participant._id;
        match.status = 'completed';
        await match.save({ session });

        // Tạo MatchResult
        const scores = {
            winner: scoreCheck.winnerScore,
            loser: scoreCheck.loserScore,
            isDraw: scoreCheck.isDraw,
            details: {
                ...(participantScores?.details || {}),
                scoringConfig: context.scoring || {},
                rankingCriteria: context.rankingCriteria || []
            },
            statistics: participantScores?.statistics || {}
        };
        await createMatchResult(match, participant._id, null, scores, session);
        const knockoutAdvanceSync = await propagateWinnerToDependentMatches(match, participant._id, session);
        const standingsSync = await rebuildStageStandings(match, context, session);
        const knockoutSync = await syncKnockoutParticipantsFromStandings(match.tournamentItemId, session);
        const finalSync = await syncKnockoutFinalResult(match, session);
        if (context.stageRule) {
            context.stageRule.standingsStatus = 'published';
            context.stageRule.standingsPublishedAt = new Date();
            context.stageRule.standingsPublishedBy = userId;
            await context.stageRule.save({ session });
        }

        await session.commitTransaction();
        return res.json({ success: true, data: match, sync: { standings: standingsSync, knockout: knockoutSync, final: finalSync, knockoutAdvance: knockoutAdvanceSync } });
    } catch (error) {
        await session.abortTransaction();
        return res.status(error.status || 500).json({ success: false, title: error.title, message: error.clientMessage || error.message });
    } finally {
        session.endSession();
    }
};

export const getMatchStatusTags = async (req, res) => {
    return res.json({ success: true, data: MATCH_STATUS_TAGS });
};

export const autoScheduleStage = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { stageId } = req.params;
        const userId = req.user._id;
        const { startAt, intervalMinutes = 30 } = req.body;
        const baseStart = startAt ? new Date(startAt) : null;
        if (!baseStart || Number.isNaN(baseStart.getTime())) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'startAt is required' });
        }

        const stage = await StageRule.findById(stageId).session(session);
        if (!stage) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Stage not found' });
        }

        const perm = await checkTournamentItemPermission(stage.tournamentItemId, userId);
        if (!perm.allowed) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: perm.message });
        }

        const syncResult = await syncMatchesFromCompetitionConfig(stage.tournamentItemId, userId, session);
        if (!syncResult.ok) {
            await session.abortTransaction();
            return res.status(syncResult.status || 400).json({ success: false, message: syncResult.message });
        }

        const [courts, rawMatches] = await Promise.all([
            Court.find({ tournamentItemId: stage.tournamentItemId, status: { $nin: ['inactived', 'maintenance'] } }).sort({ createdAt: 1 }).session(session),
            Match.find({ stageId }).sort({ scheduleOrder: 1, round: 1, createdAt: 1 }).session(session),
        ]);
        const matches = canonicalizeDuplicateMatches(rawMatches);
        if (courts.length === 0) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'No active courts available' });
        }

        const minutes = Math.max(1, Number(intervalMinutes) || 30);
        for (let index = 0; index < matches.length; index++) {
            const match = matches[index];
            const slotIndex = Math.floor(index / courts.length);
            match.scheduledTime = addMinutes(baseStart, slotIndex * minutes);
            match.courtId = courts[index % courts.length]._id;
            match.scheduleOrder = index + 1;
            const readinessCheck = await assertMatchReadyForScheduling(match, session, true);
            if (!readinessCheck.ok) {
                await session.abortTransaction();
                return res.status(readinessCheck.status || 409).json({
                    success: false,
                    title: readinessCheck.title,
                    message: readinessCheck.message,
                });
            }
            await match.save({ session });
        }

        await session.commitTransaction();
        return res.json({ success: true, message: 'Stage scheduled', data: { updated: matches.length } });
    } catch (error) {
        await session.abortTransaction();
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

export const publishStageSchedule = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { stageId } = req.params;
        const { confirmConflicts = false } = req.body;
        const userId = req.user._id;
        const stage = await StageRule.findById(stageId).session(session);
        if (!stage) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Stage not found' });
        }

        const perm = await checkTournamentItemPermission(stage.tournamentItemId, userId);
        if (!perm.allowed) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: perm.message });
        }

        const rawMatches = await Match.find({ stageId }).sort({ scheduleOrder: 1, round: 1, createdAt: 1 }).session(session);
        const matches = canonicalizeDuplicateMatches(rawMatches);
        const missing = matches.filter(match => !match.scheduledTime || !match.courtId).map(match => match._id.toString());
        if (missing.length) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Some matches are not scheduled', missing });
        }

        const conflicts = findScheduleConflicts(matches);
        if (conflicts.length && !confirmConflicts) {
            await session.abortTransaction();
            return res.status(409).json({ success: false, message: 'Schedule conflicts detected', conflicts });
        }

        await Match.updateMany({ _id: { $in: matches.map(match => match._id) } }, { $set: { scheduleStatus: 'published' } }, { session });
        await session.commitTransaction();
        return res.json({ success: true, message: 'Schedule published', conflicts });
    } catch (error) {
        await session.abortTransaction();
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

export const publishScheduledMatchesByTournamentItem = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { tournamentItemId } = req.params;
        const userId = req.user._id;
        const perm = await checkTournamentItemPermission(tournamentItemId, userId);
        if (!perm.allowed) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: perm.message });
        }

        const result = await Match.updateMany(
            {
                tournamentItemId,
                scheduledTime: { $ne: null },
                courtId: { $ne: null },
            },
            { $set: { scheduleStatus: 'published' } },
            { session },
        );
        await session.commitTransaction();
        return res.json({
            success: true,
            message: 'Scheduled matches published',
            data: { updated: Number(result.modifiedCount || 0) },
        });
    } catch (error) {
        await session.abortTransaction();
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

const evenCount = (value) => {
    const safe = Math.max(2, Number(value) || 2);
    return safe % 2 === 0 ? safe : safe + 1;
};

const collectFormatMatchPlans = (config) => {
    const plans = [];
    let matchCounter = 1;
    const stages = Array.isArray(config?.stages) ? config.stages : [];
    for (const stage of stages) {
        for (const branch of Array.isArray(stage.brackets) ? stage.brackets : []) {
            if (branch.type !== 'knockout') continue;
            const count = evenCount(Math.max(
                Array.isArray(branch.flowSlots) ? branch.flowSlots.length : 0,
                Number(branch.totalTeamsIn) || 2,
            ));
            const deleted = new Set(Array.isArray(branch.flowDeletedMatchIds) ? branch.flowDeletedMatchIds : []);
            for (let index = 0; index < Math.max(1, Math.ceil(count / 2)); index++) {
                const nodeId = `${stage.id}:${branch.id}:m-${index + 1}`;
                const matchCode = `M${matchCounter++}`;
                if (deleted.has(nodeId)) continue;
                const slots = [
                    branch.flowSlots?.[index * 2] || { label: `Slot ${index * 2 + 1}` },
                    branch.flowSlots?.[index * 2 + 1] || { label: `Slot ${index * 2 + 2}` },
                ];
                plans.push({ stage, branch, nodeId, matchCode, slots });
            }
            for (const match of Array.isArray(branch.flowStandaloneMatches) ? branch.flowStandaloneMatches : []) {
                const matchCode = String(match.matchCode || `M${matchCounter++}`);
                if (match.matchCode) matchCounter++;
                plans.push({
                    stage,
                    branch,
                    nodeId: match.id,
                    matchCode,
                    slots: [
                        match.seedSlots?.[0] || { label: 'Slot 1' },
                        match.seedSlots?.[1] || { label: 'Slot 2' },
                    ],
                });
            }
        }
    }
    return plans;
};

const sourceLabelForMatchPlan = (plan) => String(plan?.matchCode || plan?.sourceLabel || plan?.label || 'Winner');

const normalizeSlotLabel = (slot, fallbackIndex) => {
    const label = String(slot?.sourceLabel || slot?.label || '').trim();
    if (label && !/^slot\s+\d+$/i.test(label)) return label;
    return `Seed ${fallbackIndex + 1}`;
};

const assignmentMapForStage = (stage) => new Map(
    (Array.isArray(stage.seedAssignments) ? stage.seedAssignments : []).map((assignment) => [assignment.slotId, assignment]),
);

const participantIdsForPlan = (plan) => {
    const assignments = assignmentMapForStage(plan.stage);
    const ids = [];
    plan.slots.forEach((slot, slotIndex) => {
        const globalIndex = slot.globalIndex ?? slotIndex;
        const direct = assignments.get(`${plan.nodeId}:seed-${globalIndex}`);
        if (direct?.participantId) ids.push(direct.participantId);
    });
    return ids;
};

const syncMatchesFromCompetitionConfig = async (tournamentItemId, userId, session, options = {}) => {
    const perm = await checkTournamentItemPermission(tournamentItemId, userId);
    if (!perm.allowed) return { ok: false, status: 403, message: perm.message };
    const item = await TournamentItem.findById(tournamentItemId).session(session);
    const config = item?.competitionFormat?.config;
    if (!config || !Array.isArray(config.stages)) return { ok: false, status: 400, message: 'Competition format is not configured' };

    const existingMatchCount = await Match.countDocuments({ tournamentItemId }).session(session);
    if (existingMatchCount > 0 && !options.force) {
        console.info('[matches.syncFromFormat] skipped: existing matches preserved', {
            tournamentItemId: String(tournamentItemId),
            existingMatchCount,
        });
        return { ok: true, skipped: 'existingMatches', existingMatchCount };
    }

    const completedCount = await Match.countDocuments({ tournamentItemId, status: 'completed' }).session(session);
    if (completedCount > 0) {
        await Match.deleteMany({ tournamentItemId, status: { $ne: 'completed' } }).session(session);
    } else {
        await Match.deleteMany({ tournamentItemId }).session(session);
        await Group.deleteMany({ tournamentItemId }).session(session);
        await Bracket.deleteMany({ TournamentItem: tournamentItemId }).session(session);
    }

    const stageRuleByFormatId = new Map();
    for (const [stageIndex, stageConfig] of config.stages.entries()) {
        const number = Number(stageConfig.order || stageIndex + 1);
        const stageRule = await StageRule.findOneAndUpdate(
            { tournamentItemId, number },
            {
                tournamentItemId,
                number,
                name: stageConfig.name || `Stage ${number}`,
                totalTeamsIn: Number(stageConfig.input?.teams || 2),
                hasBracket: true,
                status: number === 1 ? 'actived' : 'pending',
            },
            { new: true, upsert: true, session },
        );
        stageRuleByFormatId.set(stageConfig.id, stageRule);

        for (const branch of Array.isArray(stageConfig.brackets) ? stageConfig.brackets : []) {
            if (branch.type !== 'group') continue;
            const bracket = await Bracket.create([{
                TournamentItem: tournamentItemId,
                stageId: stageRule._id,
                type: 'group',
                name: branch.name || stageConfig.name,
                totalTeamsIn: Number(branch.totalTeamsIn || stageConfig.input?.teams || 2),
                group: [],
            }], { session }).then(items => items[0]);
            const assignments = assignmentMapForStage(stageConfig);
            const groups = Array.isArray(branch.groups) && branch.groups.length ? branch.groups : [{ name: branch.name || 'Bảng A', numberOfTeams: branch.totalTeamsIn || 2 }];
            for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
                const groupConfig = groups[groupIndex];
                const group = await Group.create([{
                    name: groupConfig.name || `Bảng ${String.fromCharCode(65 + groupIndex)}`,
                    tournamentItemId,
                    bracketId: bracket._id,
                    sport: config.sportType || 'Pickleball',
                    stageRuleId: stageRule._id,
                    status: 'pending',
                    matches: [],
                }], { session }).then(items => items[0]);
                bracket.group.push(group._id);
                const teamIds = Array.from({ length: Math.max(1, Number(groupConfig.numberOfTeams) || 1) }, (_, slotIndex) => {
                    const slotId = `${stageConfig.id}:${branch.id}:group-${groupIndex + 1}:slot-${slotIndex + 1}`;
                    return assignments.get(slotId)?.participantId;
                }).filter(Boolean);
                const rounds = generateRoundRobinPairs(teamIds);
                let localIndex = 1;
                for (let roundIndex = 0; roundIndex < rounds.length; roundIndex++) {
                    for (const [teamA, teamB] of rounds[roundIndex]) {
                        const match = await Match.create([{
                            tournamentItemId,
                            stageId: stageRule._id,
                            bracketId: bracket._id,
                            groupId: group._id,
                            name: `${group.name} - Match ${localIndex}`,
                            round: roundIndex + 1,
                            participants: [teamA, teamB],
                            formatStageId: stageConfig.id,
                            formatNodeId: `${stageConfig.id}:${branch.id}:group-${groupIndex + 1}:match-${localIndex}`,
                            formatSlotLabels: [String(teamA), String(teamB)],
                            status: 'pending',
                            scheduleStatus: 'draft',
                            previousMatches: [],
                        }], { session }).then(items => items[0]);
                        group.matches.push(match._id);
                        localIndex++;
                    }
                }
                await group.save({ session });
            }
            await bracket.save({ session });
        }
    }

    const plans = collectFormatMatchPlans(config);
    const createdByNodeId = new Map();
    const planByNodeId = new Map();
    for (const plan of plans) {
        const stageRule = stageRuleByFormatId.get(plan.stage.id);
        if (!stageRule) continue;
        const bracket = await Bracket.create([{
            TournamentItem: tournamentItemId,
            stageId: stageRule._id,
            type: plan.branch.type || 'knockout',
            name: plan.branch.name || plan.stage.name,
            totalTeamsIn: Number(plan.branch.totalTeamsIn || 2),
            group: [],
        }], { session }).then(items => items[0]);
        const participantIds = participantIdsForPlan(plan);
        const match = await Match.create([{
            tournamentItemId,
            stageId: stageRule._id,
            bracketId: bracket._id,
            name: plan.matchCode,
            round: Number(plan.stage.order || 1),
            participants: participantIds,
            formatStageId: plan.stage.id,
            formatNodeId: plan.nodeId,
            formatSlotLabels: plan.slots.map((slot, slotIndex) => normalizeSlotLabel(slot, slotIndex)),
            status: 'pending',
            scheduleStatus: 'draft',
            previousMatches: [],
        }], { session }).then(items => items[0]);
        createdByNodeId.set(plan.nodeId, match);
        planByNodeId.set(plan.nodeId, plan);
    }

    const incomingSlotIndexByTarget = new Map();
    for (const stageConfig of config.stages) {
        for (const branch of Array.isArray(stageConfig.brackets) ? stageConfig.brackets : []) {
            for (const connection of Array.isArray(branch.flowConnections) ? branch.flowConnections : []) {
                const source = createdByNodeId.get(connection.source);
                const target = createdByNodeId.get(connection.target);
                if (!source || !target) continue;
                const targetKey = String(connection.target);
                const slotIndex = incomingSlotIndexByTarget.get(targetKey) || 0;
                incomingSlotIndexByTarget.set(targetKey, slotIndex + 1);
                const sourcePlan = planByNodeId.get(connection.source);
                const sourceLabel = String(connection.label || sourceLabelForMatchPlan(sourcePlan) || source.name || '').trim();
                const labels = Array.isArray(target.formatSlotLabels) ? [...target.formatSlotLabels] : [];
                labels[slotIndex] = sourceLabel;
                target.formatSlotLabels = [labels[0] || 'Seed 1', labels[1] || 'Seed 2'];
                target.previousMatches.push({ matchId: source._id, position: 'WINNER' });
                const slotSources = Array.isArray(target.slotSources) ? [...target.slotSources] : [];
                const existingSourceIndex = slotSources.findIndex((slot) => Number(slot?.slotIndex) === slotIndex);
                const slotSource = {
                    slotIndex,
                    sourceType: 'winnerOfMatch',
                    sourceMatchId: source._id,
                    sourceMatchCode: source.name,
                    sourceStageId: source.stageId?._id || source.stageId || null,
                    sourceBranchKey: branchKeyForMatch(source),
                    sourceKey: sourceLabel,
                };
                if (existingSourceIndex >= 0) {
                    slotSources[existingSourceIndex] = slotSource;
                } else {
                    slotSources.push(slotSource);
                }
                target.slotSources = slotSources;
                await target.save({ session });
                source.nextMatchId = target._id;
                await source.save({ session });
            }
        }
    }

    return { ok: true };
};

export const syncMatchesFromFormat = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const userId = req.user._id;
        const { tournamentItemId } = req.params;
        const result = await syncMatchesFromCompetitionConfig(tournamentItemId, userId, session, { force: Boolean(req.body?.force) });
        if (!result.ok) {
            await session.abortTransaction();
            return res.status(result.status || 400).json({ success: false, message: result.message });
        }
        await session.commitTransaction();
        return res.json({ success: true, message: result.skipped ? 'Existing matches preserved' : 'Matches synced from competition format', data: result });
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
            if (item.scheduleOrder !== undefined) match.scheduleOrder = Number(item.scheduleOrder) || 0;
            if (item.scheduleStatus && ['draft', 'published'].includes(item.scheduleStatus)) match.scheduleStatus = item.scheduleStatus;
            if (item.status) match.status = item.status;

            if (item.scheduledTime || item.courtId) {
                const readinessCheck = await assertMatchReadyForScheduling(match, session);
                if (!readinessCheck.ok) {
                    await session.abortTransaction();
                    return res.status(readinessCheck.status || 409).json({
                        success: false,
                        title: readinessCheck.title,
                        message: readinessCheck.message,
                    });
                }
                const conflictCheck = await assertNoScheduleConflicts(match, session);
                if (!conflictCheck.ok) {
                    await session.abortTransaction();
                    return res.status(conflictCheck.status || 409).json({
                        success: false,
                        title: conflictCheck.title,
                        message: conflictCheck.message,
                    });
                }
            }

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
