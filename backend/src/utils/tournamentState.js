import mongoose from 'mongoose';
import Match from '../models/matches.js';
import Participant from '../models/participants.js';
import KnockoutResult from '../models/knockoutResults.js';

const ACTIVE_PARTICIPANT_STATUS = { $nin: ['rejected', 'suspended'] };
const IGNORED_MATCH_STATUS = ['cancelled', 'canceled', 'deleted'];

const toId = (value) => String(value?._id || value || '');

const toPlainObject = (item) => (typeof item?.toObject === 'function' ? item.toObject() : { ...item });

export const countRegisteredTeams = async (tournamentItemIds, session = null) => {
    const ids = [...new Set((Array.isArray(tournamentItemIds) ? tournamentItemIds : [tournamentItemIds])
        .map(toId)
        .filter((id) => mongoose.Types.ObjectId.isValid(id)))];
    if (ids.length === 0) return new Map();

    const rows = await Participant.aggregate([
        {
            $match: {
                tournamentItemId: { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) },
                type: 'team',
                registrationStatus: ACTIVE_PARTICIPANT_STATUS,
            },
        },
        { $group: { _id: '$tournamentItemId', count: { $sum: 1 } } },
    ]).session(session);

    return new Map(rows.map((row) => [toId(row._id), Number(row.count || 0)]));
};

const getMatchSummary = async (ids, session = null) => {
    const rows = await Match.aggregate([
        {
            $match: {
                tournamentItemId: { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) },
                status: { $nin: IGNORED_MATCH_STATUS },
            },
        },
        {
            $group: {
                _id: '$tournamentItemId',
                total: { $sum: 1 },
                completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                live: { $sum: { $cond: [{ $eq: ['$status', 'live'] }, 1, 0] } },
            },
        },
    ]).session(session);

    return new Map(rows.map((row) => [toId(row._id), {
        total: Number(row.total || 0),
        completed: Number(row.completed || 0),
        live: Number(row.live || 0),
    }]));
};

const getFinalResultItemIds = async (ids, session = null) => {
    const rows = await KnockoutResult.find({
        tournamentItemId: { $in: ids },
        championParticipantId: { $ne: null },
        runnerUpParticipantId: { $ne: null },
    })
        .select('tournamentItemId')
        .lean()
        .session(session);
    return new Set(rows.map((row) => toId(row.tournamentItemId)));
};

export const deriveTournamentItemStatus = (item, matchSummary, hasFinalResult, now = new Date()) => {
    if (item.status === 'cancelled') return 'cancelled';
    if (hasFinalResult) return 'completed';
    if (matchSummary?.total > 0 && matchSummary.completed >= matchSummary.total) return 'completed';
    if (matchSummary?.live > 0 || matchSummary?.completed > 0) return 'playing';

    const start = item.timeLine?.tournamentStart ? new Date(item.timeLine.tournamentStart) : null;
    const end = item.timeLine?.tournamentEnd ? new Date(item.timeLine.tournamentEnd) : null;
    if (start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start <= now && now <= end) {
        return 'playing';
    }

    if (item.status === 'actived') return 'actived';
    return 'upcoming';
};

export const decorateTournamentItems = async (items, session = null) => {
    const list = (Array.isArray(items) ? items : [items]).filter(Boolean);
    const ids = list.map(toId).filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (ids.length === 0) return Array.isArray(items) ? [] : null;

    const [teamCounts, matchSummaries, finalResultIds] = await Promise.all([
        countRegisteredTeams(ids, session),
        getMatchSummary(ids, session),
        getFinalResultItemIds(ids, session),
    ]);

    const decorated = list.map((item) => {
        const plain = toPlainObject(item);
        const id = toId(plain._id);
        const status = deriveTournamentItemStatus(plain, matchSummaries.get(id), finalResultIds.has(id));
        return {
            ...plain,
            status,
            registeredTeams: teamCounts.get(id) || 0,
        };
    });

    return Array.isArray(items) ? decorated : decorated[0];
};

export const decorateTournamentWithItems = async (tournaments, session = null) => {
    const list = (Array.isArray(tournaments) ? tournaments : [tournaments]).filter(Boolean);
    const itemMap = new Map();
    list.forEach((tournament) => {
        const plain = toPlainObject(tournament);
        const items = plain.tournamnetItem || [];
        if (Array.isArray(items)) {
            items.forEach((item) => {
                if (item && typeof item === 'object') itemMap.set(toId(item._id), item);
            });
        }
    });

    const decoratedItems = await decorateTournamentItems([...itemMap.values()], session);
    const decoratedById = new Map(decoratedItems.map((item) => [toId(item._id), item]));

    const decorated = list.map((tournament) => {
        const plain = toPlainObject(tournament);
        const items = Array.isArray(plain.tournamnetItem)
            ? plain.tournamnetItem.map((item) => decoratedById.get(toId(item._id)) || item)
            : [];
        const statuses = items.map((item) => item.status).filter(Boolean);
        const status = plain.status === 'cancelled'
            ? 'cancelled'
            : statuses.length > 0 && statuses.every((value) => value === 'completed')
                ? 'completed'
                : statuses.some((value) => value === 'playing')
                    ? 'playing'
                    : statuses.some((value) => value === 'actived')
                        ? 'actived'
                        : plain.status;
        return { ...plain, status, tournamnetItem: items };
    });

    return Array.isArray(tournaments) ? decorated : decorated[0];
};
