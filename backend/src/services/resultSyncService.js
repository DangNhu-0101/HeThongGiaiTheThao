import mongoose from 'mongoose';
import MatchResult from '../models/matchResults.js';
import Participant from '../models/participants.js';
import TeamAchievement from '../models/teamAchievements.js';
import PlayerMatchStat from '../models/playerMatchStats.js';

const toId = (value) => String(value?._id || value || '');

const uniqueIds = (values) => [...new Set(values.map(toId).filter(Boolean))];

export const syncTeamAchievementsFromKnockoutResult = async (knockoutResult, session = null) => {
    if (!knockoutResult?.finalMatchId || !knockoutResult?.championParticipantId || !knockoutResult?.runnerUpParticipantId) {
        return { upserted: 0, removed: 0 };
    }

    const targets = buildAchievementTargets(knockoutResult);
    if (targets.length === 0) {
        await TeamAchievement.deleteMany({ finalMatchId: knockoutResult.finalMatchId }).session(session);
        return { upserted: 0, removed: 2 };
    }

    const keepIds = [];
    for (const target of targets) {
        const record = await TeamAchievement.findOneAndUpdate(
            {
                tournamentItemId: target.tournamentItemId,
                finalMatchId: target.finalMatchId,
                achievementType: target.achievementType,
            },
            { $set: target },
            { upsert: true, returnDocument: 'after', session },
        );
        keepIds.push(record._id);
    }

    const staleDelete = await TeamAchievement.deleteMany({
        tournamentItemId: knockoutResult.tournamentItemId,
        finalMatchId: knockoutResult.finalMatchId,
        achievementType: { $in: ['champion', 'runner-up'] },
        _id: { $nin: keepIds },
    }).session(session);

    return { upserted: targets.length, removed: staleDelete.deletedCount || 0 };
};

export const buildAchievementTargets = (knockoutResult) => {
    const championId = knockoutResult.championParticipantId?._id || knockoutResult.championParticipantId;
    const runnerUpId = knockoutResult.runnerUpParticipantId?._id || knockoutResult.runnerUpParticipantId;
    if (toId(championId) === toId(runnerUpId)) {
        return [];
    }

    const common = {
        tournamentItemId: knockoutResult.tournamentItemId,
        branchId: knockoutResult.branchId || null,
        branchKey: knockoutResult.branchKey || toId(knockoutResult.finalMatchId),
        branchName: knockoutResult.branchName || '',
        finalMatchId: knockoutResult.finalMatchId,
        finalStageId: knockoutResult.finalStageId,
        finalScore: knockoutResult.finalScore || {},
        achievedAt: knockoutResult.determinedAt || new Date(),
        source: 'knockout-final',
    };

    return [
        {
            ...common,
            participantId: championId,
            achievementType: 'champion',
            title: 'Quán quân',
        },
        {
            ...common,
            participantId: runnerUpId,
            achievementType: 'runner-up',
            title: 'Á quân',
        },
    ];
};

export const revokeTeamAchievementsForMatch = async (matchId, session = null) => {
    const result = await TeamAchievement.deleteMany({
        finalMatchId: matchId,
        achievementType: { $in: ['champion', 'runner-up'] },
    }).session(session);
    return { removed: result.deletedCount || 0 };
};

const resultForParticipant = (participantId, winnerId, isDraw) => {
    if (isDraw) return 'draw';
    return toId(participantId) === toId(winnerId) ? 'win' : 'loss';
};

const statNumbers = (result) => ({
    played: 1,
    wins: result === 'win' ? 1 : 0,
    losses: result === 'loss' ? 1 : 0,
    draws: result === 'draw' ? 1 : 0,
});

const buildRosterFromParticipants = async (participantIds, session = null) => {
    const participants = await Participant.find({ _id: { $in: participantIds } })
        .select('_id lineup')
        .lean()
        .session(session);
    return participants.flatMap((participant) => uniqueIds((participant.lineup || []).map((item) => item.Player))
        .map((playerId) => ({
            playerId,
            participantId: participant._id,
        })));
};

export const syncPlayerMatchStats = async (match, session = null) => {
    const matchId = match?._id;
    if (!matchId) return { upserted: 0, removed: 0 };

    const status = String(match.status || '');
    if (status !== 'completed' || !match.winnerParticipantId) {
        const removed = await PlayerMatchStat.deleteMany({ matchId }).session(session);
        return { upserted: 0, removed: removed.deletedCount || 0 };
    }

    const participantIds = uniqueIds(match.participants || []);
    if (participantIds.length === 0) {
        const removed = await PlayerMatchStat.deleteMany({ matchId }).session(session);
        return { upserted: 0, removed: removed.deletedCount || 0 };
    }

    const result = await MatchResult.findOne({ matchId }).lean().session(session);
    const existingRows = await PlayerMatchStat.find({ matchId }).lean().session(session);
    const roster = existingRows.length > 0
        ? existingRows.map((row) => ({ playerId: row.playerId, participantId: row.participantId }))
        : await buildRosterFromParticipants(participantIds, session);

    const allowedParticipantIds = new Set(participantIds);
    const desired = buildPlayerMatchStatTargets({ match, result, roster });

    const keepPlayerIds = [];
    for (const row of desired) {
        keepPlayerIds.push(toId(row.playerId));
        await PlayerMatchStat.findOneAndUpdate(
            { playerId: row.playerId, matchId },
            { $set: row },
            { upsert: true, returnDocument: 'after', session },
        );
    }

    const removed = await PlayerMatchStat.deleteMany({
        matchId,
        playerId: { $nin: keepPlayerIds },
    }).session(session);

    return { upserted: desired.length, removed: removed.deletedCount || 0 };
};

export const buildPlayerMatchStatTargets = ({ match, result = null, roster = [] }) => {
    const participantIds = new Set(uniqueIds(match?.participants || []));
    const seenPlayerIds = new Set();
    return roster
        .filter((row) => participantIds.has(toId(row.participantId)))
        .filter((row) => {
            const playerId = toId(row.playerId);
            if (!playerId || seenPlayerIds.has(playerId)) return false;
            seenPlayerIds.add(playerId);
            return true;
        })
        .map((row) => {
            const playerResult = resultForParticipant(row.participantId, match.winnerParticipantId, Boolean(result?.isDraw));
            return {
                playerId: row.playerId,
                participantId: row.participantId,
                matchId: match._id,
                tournamentItemId: match.tournamentItemId,
                result: playerResult,
                ...statNumbers(playerResult),
                countedAt: result?.confirmedAt || result?.updatedAt || new Date(),
            };
        });
};

export const aggregatePlayerStats = async (playerIds, session = null) => {
    const ids = uniqueIds(playerIds);
    if (ids.length === 0) return new Map();

    const rows = await PlayerMatchStat.aggregate([
        { $match: { playerId: { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) } } },
        {
            $group: {
                _id: '$playerId',
                matches: { $sum: '$played' },
                wins: { $sum: '$wins' },
                losses: { $sum: '$losses' },
                draws: { $sum: '$draws' },
            },
        },
    ]).session(session);

    return new Map(rows.map((row) => [toId(row._id), {
        matches: Number(row.matches || 0),
        wins: Number(row.wins || 0),
        losses: Number(row.losses || 0),
        draws: Number(row.draws || 0),
    }]));
};
