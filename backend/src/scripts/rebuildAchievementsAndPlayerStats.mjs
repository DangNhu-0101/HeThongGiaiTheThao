import mongoose from 'mongoose';
import { connectDB } from '../libs/db.js';
import Match from '../models/matches.js';
import '../models/rules/brackets.js';
import KnockoutResult from '../models/knockoutResults.js';
import TeamAchievement from '../models/teamAchievements.js';
import PlayerMatchStat from '../models/playerMatchStats.js';
import {
    syncPlayerMatchStats,
    syncTeamAchievementsFromKnockoutResult,
} from '../services/resultSyncService.js';

const apply = process.argv.includes('--apply');
const dryRunLabel = apply ? 'APPLY' : 'DRY RUN';

const toId = (value) => String(value?._id || value || '');
const normalizeMatchCode = (value) => String(value || '').trim().toUpperCase();
const branchKeyForMatch = (match) => {
    const nodeParts = String(match.formatNodeId || '').split(':').filter(Boolean);
    if (nodeParts.length >= 2) return nodeParts[1];
    return toId(match.bracketId);
};

const isValidKnockoutResult = (row) => {
    const finalMatch = row.finalMatchId;
    if (!finalMatch || finalMatch.status !== 'completed') return false;
    const championId = toId(row.championParticipantId);
    const runnerUpId = toId(row.runnerUpParticipantId);
    if (!championId || !runnerUpId || championId === runnerUpId) return false;
    const finalParticipantIds = (finalMatch.participants || []).map(toId);
    return finalParticipantIds.includes(championId) && finalParticipantIds.includes(runnerUpId);
};

const loadOfficialKnockoutResults = async () => {
    const allKnockoutMatches = await Match.find({})
        .populate('bracketId', 'type name')
        .lean();
    const knockoutByTournament = new Map();
    allKnockoutMatches
        .filter((match) => String(match.bracketId?.type || '') === 'knockout')
        .forEach((match) => {
            const tournamentId = toId(match.tournamentItemId);
            if (!knockoutByTournament.has(tournamentId)) knockoutByTournament.set(tournamentId, []);
            knockoutByTournament.get(tournamentId).push(match);
        });
    const rows = await KnockoutResult.find({})
        .populate('finalMatchId', 'name status participants winnerParticipantId tournamentItemId bracketId formatNodeId previousMatches slotSources nextMatchId nextLoserMatchId')
        .populate('championParticipantId', 'name')
        .populate('runnerUpParticipantId', 'name')
        .sort({ determinedAt: -1, updatedAt: -1 })
        .lean();

    const isTerminalFinal = (row) => {
        const match = row.finalMatchId;
        if (!match) return false;
        const branchKey = branchKeyForMatch(match);
        const branchMatches = (knockoutByTournament.get(toId(match.tournamentItemId)) || [])
            .filter((item) => branchKeyForMatch(item) === branchKey);
        const matchId = toId(match);
        const matchCode = normalizeMatchCode(match.name);
        if (match.nextMatchId || match.nextLoserMatchId) return false;
        return !branchMatches.some((item) => {
            if (toId(item) === matchId) return false;
            if (toId(item.nextMatchId) === matchId || toId(item.nextLoserMatchId) === matchId) return true;
            if ((item.previousMatches || []).some((entry) => toId(entry.matchId) === matchId)) return true;
            return (item.slotSources || []).some((slot) =>
                toId(slot.sourceMatchId) === matchId
                || (matchCode && normalizeMatchCode(slot.sourceMatchCode || slot.sourceKey) === matchCode)
            );
        });
    };

    const invalid = rows.filter((row) => !isValidKnockoutResult(row) || !isTerminalFinal(row));
    const latestByFinalMatch = new Map();
    const duplicates = [];
    rows.filter((row) => isValidKnockoutResult(row) && isTerminalFinal(row)).forEach((row) => {
        const finalMatchId = toId(row.finalMatchId);
        if (latestByFinalMatch.has(finalMatchId)) {
            duplicates.push(row);
            return;
        }
        latestByFinalMatch.set(finalMatchId, row);
    });

    return {
        official: [...latestByFinalMatch.values()],
        invalid,
        duplicates,
    };
};

const rebuildAchievements = async () => {
    const { official, invalid, duplicates } = await loadOfficialKnockoutResults();
    const tournamentItemIds = [...new Set(official.map((row) => toId(row.tournamentItemId)).filter(Boolean))];
    const achievementDeleteFilter = {
        tournamentItemId: { $in: tournamentItemIds },
        achievementType: { $in: ['champion', 'runner-up'] },
    };
    const existingAchievements = tournamentItemIds.length
        ? await TeamAchievement.find(achievementDeleteFilter).lean()
        : [];

    console.log(`[${dryRunLabel}] existing champion/runner-up achievements to rebuild: ${existingAchievements.length}`);
    existingAchievements.forEach((row) => {
        console.log(`- delete TeamAchievement ${row._id}: finalMatch=${toId(row.finalMatchId)}, team=${toId(row.participantId)}, type=${row.achievementType}`);
    });
    console.log(`[${dryRunLabel}] invalid knockout results: ${invalid.length}`);
    invalid.forEach((row) => {
        console.log(`- delete invalid KnockoutResult ${row._id}: finalMatch=${toId(row.finalMatchId)}, champion=${toId(row.championParticipantId)}, runnerUp=${toId(row.runnerUpParticipantId)}`);
    });
    console.log(`[${dryRunLabel}] duplicate knockout results: ${duplicates.length}`);
    duplicates.forEach((row) => {
        console.log(`- delete duplicate KnockoutResult ${row._id}: finalMatch=${toId(row.finalMatchId)}`);
    });
    console.log(`[${dryRunLabel}] official final results to create achievements: ${official.length}`);
    official.forEach((row) => {
        console.log(`- ${row.finalMatchId?.name || toId(row.finalMatchId)} (${row.branchName || row.branchKey}): champion=${row.championParticipantId?.name || toId(row.championParticipantId)}, runner-up=${row.runnerUpParticipantId?.name || toId(row.runnerUpParticipantId)}`);
    });

    if (!apply) return { official, invalid, duplicates };

    if (existingAchievements.length) await TeamAchievement.deleteMany(achievementDeleteFilter);
    const badIds = [...invalid, ...duplicates].map((row) => row._id);
    if (badIds.length) await KnockoutResult.deleteMany({ _id: { $in: badIds } });
    for (const row of official) {
        await syncTeamAchievementsFromKnockoutResult({
            ...row,
            finalMatchId: row.finalMatchId?._id || row.finalMatchId,
            championParticipantId: row.championParticipantId?._id || row.championParticipantId,
            runnerUpParticipantId: row.runnerUpParticipantId?._id || row.runnerUpParticipantId,
        });
    }
    return { official, invalid, duplicates };
};

const rebuildPlayerStats = async () => {
    const completedMatches = await Match.find({
        status: 'completed',
        winnerParticipantId: { $ne: null },
    }).lean();
    const matchIds = completedMatches.map((match) => match._id);
    const existingRows = matchIds.length ? await PlayerMatchStat.find({ matchId: { $in: matchIds } }).lean() : [];

    console.log(`[${dryRunLabel}] player match stat rows to rebuild: ${existingRows.length}`);
    console.log(`[${dryRunLabel}] completed matches to sync player stats: ${completedMatches.length}`);
    completedMatches.forEach((match) => {
        console.log(`- sync ${match.name || match._id}: winner=${toId(match.winnerParticipantId)}, participants=${(match.participants || []).map(toId).join(',')}`);
    });

    if (!apply) return { completedMatches, existingRows };

    if (matchIds.length) await PlayerMatchStat.deleteMany({ matchId: { $in: matchIds } });
    for (const match of completedMatches) {
        await syncPlayerMatchStats(match);
    }
    return { completedMatches, existingRows };
};

const run = async () => {
    await connectDB();
    await rebuildAchievements();
    await rebuildPlayerStats();
    await mongoose.disconnect();
};

run().catch(async (error) => {
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
});
