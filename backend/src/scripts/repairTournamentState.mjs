import mongoose from 'mongoose';
import { connectDB } from '../libs/db.js';
import TournamentItem from '../models/tournamentItem.js';
import Tournament from '../models/tournaments.js';
import KnockoutResult from '../models/knockoutResults.js';
import { countRegisteredTeams, decorateTournamentItems } from '../utils/tournamentState.js';

const apply = process.argv.includes('--apply');
const dryRunLabel = apply ? 'APPLY' : 'DRY RUN';

const toId = (value) => String(value?._id || value || '');

const findInvalidKnockoutResults = async () => {
    const rows = await KnockoutResult.find({})
        .populate('finalMatchId', 'status participants winnerParticipantId')
        .lean();

    return rows.filter((row) => {
        const finalMatch = row.finalMatchId;
        if (!finalMatch || finalMatch.status !== 'completed') return true;
        const championId = toId(row.championParticipantId);
        const runnerUpId = toId(row.runnerUpParticipantId);
        if (!championId || !runnerUpId || championId === runnerUpId) return true;
        const participantIds = (finalMatch.participants || []).map(toId);
        return !participantIds.includes(championId) || !participantIds.includes(runnerUpId);
    });
};

const repair = async () => {
    await connectDB();

    const items = await TournamentItem.find({ status: { $ne: 'cancelled' } }).lean();
    const decorated = await decorateTournamentItems(items);
    const countMap = await countRegisteredTeams(items.map((item) => item._id));

    const itemUpdates = decorated
        .filter((item) => item.status !== items.find((raw) => toId(raw._id) === toId(item._id))?.status
            || Number(item.registeredTeams || 0) !== Number(items.find((raw) => toId(raw._id) === toId(item._id))?.registeredTeams || 0))
        .map((item) => ({
            id: item._id,
            name: item.name,
            status: item.status,
            registeredTeams: countMap.get(toId(item._id)) || 0,
        }));

    const invalidResults = await findInvalidKnockoutResults();

    console.log(`[${dryRunLabel}] tournament items to update: ${itemUpdates.length}`);
    itemUpdates.forEach((item) => {
        console.log(`- ${item.name}: status=${item.status}, registeredTeams=${item.registeredTeams}`);
    });
    console.log(`[${dryRunLabel}] invalid knockout results to remove: ${invalidResults.length}`);
    invalidResults.forEach((row) => {
        console.log(`- ${row._id}: tournamentItem=${toId(row.tournamentItemId)}, finalMatch=${toId(row.finalMatchId)}`);
    });

    if (apply) {
        for (const item of itemUpdates) {
            await TournamentItem.updateOne(
                { _id: item.id },
                { $set: { status: item.status, registeredTeams: item.registeredTeams } },
            );
        }
        if (invalidResults.length > 0) {
            await KnockoutResult.deleteMany({ _id: { $in: invalidResults.map((row) => row._id) } });
        }

        const parentTournaments = await Tournament.find({ status: { $ne: 'cancelled' } })
            .populate('tournamnetItem')
            .lean();
        for (const tournament of parentTournaments) {
            const statuses = (tournament.tournamnetItem || []).map((item) => item.status);
            if (statuses.length === 0) continue;
            const status = statuses.every((value) => value === 'completed')
                ? 'completed'
                : statuses.some((value) => value === 'playing')
                    ? 'playing'
                    : statuses.some((value) => value === 'actived')
                        ? 'actived'
                        : 'upcoming';
            if (status !== tournament.status) {
                await Tournament.updateOne({ _id: tournament._id }, { $set: { status } });
                console.log(`- parent ${tournament.name}: status=${status}`);
            }
        }
    }

    await mongoose.disconnect();
};

repair().catch(async (error) => {
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
});
