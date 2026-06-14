// services/stageCreationService.js
import mongoose from 'mongoose';
import StageRule from '../models/stageRules.js';
import Bracket from '../models/brackets.js';
import Group from '../models/groups.js';
import Match from '../models/match.js';

/**
 * Tạo các trận đấu vòng bảng (round-robin) cho một group
 */
async function createRoundRobinMatches({ groupId, tournamentItemId, stageId, bracketId, startRound, numberOfTeams, session }) {
    const matches = [];
    let matchCounter = 0;
    for (let i = 1; i <= numberOfTeams; i++) {
        for (let j = i + 1; j <= numberOfTeams; j++) {
            const match = new Match({
                tournamentItemId,
                stageId,
                bracketId,
                groupId,
                name: `Trận ${matchCounter + 1}`,
                round: startRound + matchCounter,
                status: 'pending',
                previousMatches: [],
                nextMatchId: null,
                winnerParticipantId: null
            });
            await match.save({ session });
            matches.push(match._id);
            matchCounter++;
        }
    }
    if (matches.length) {
        await Group.findByIdAndUpdate(groupId, { $push: { matches: { $each: matches } } }, { session });
    }
    return matches;
}

/**
 * Tạo cây đấu loại trực tiếp (single elimination)
 */
async function createKnockoutMatches({ bracketId, tournamentItemId, stageId, totalTeams, startRound, session }) {
    const totalMatches = totalTeams - 1;
    const matches = [];
    for (let i = 0; i < totalMatches; i++) {
        const match = new Match({
            tournamentItemId,
            stageId,
            bracketId,
            name: `Trận ${i + 1}`,
            round: 0,
            status: 'pending',
            previousMatches: [],
            nextMatchId: null,
            winnerParticipantId: null
        });
        await match.save({ session });
        matches.push(match);
    }
    const rounds = Math.ceil(Math.log2(totalTeams));
    let roundMatches = [];
    let startIdx = 0;
    let matchesInRound = totalTeams / 2;
    for (let r = 0; r < rounds; r++) {
        const endIdx = startIdx + matchesInRound;
        const roundSlice = matches.slice(startIdx, endIdx);
        roundMatches.push(roundSlice);
        startIdx = endIdx;
        matchesInRound = Math.floor(matchesInRound / 2);
    }
    for (let r = 0; r < roundMatches.length; r++) {
        const currentRoundMatches = roundMatches[r];
        for (let i = 0; i < currentRoundMatches.length; i++) {
            const match = currentRoundMatches[i];
            match.round = startRound + r;
            await match.save({ session });
            if (r < roundMatches.length - 1) {
                const nextRoundMatches = roundMatches[r + 1];
                const nextIdx = Math.floor(i / 2);
                if (nextRoundMatches[nextIdx]) {
                    match.nextMatchId = nextRoundMatches[nextIdx]._id;
                    await match.save({ session });
                    nextRoundMatches[nextIdx].previousMatches.push({ matchId: match._id, position: 'WINNER' });
                    await nextRoundMatches[nextIdx].save({ session });
                }
            }
        }
    }
    return matches.map(m => m._id);
}

/**
 * Tạo stage cùng với brackets, groups, matches (nếu có)
 */
export const createStageWithBrackets = async ({ tournamentItemId, stageData, brackets, session }) => {
    // 1. Tạo StageRule
    const stage = new StageRule({
        tournamentItemId,
        number: stageData.number,
        name: stageData.name,
        startDate: stageData.startDate ? new Date(stageData.startDate) : null,
        endDate: stageData.endDate ? new Date(stageData.endDate) : null,
        pointsConfig: stageData.pointsConfig || { win: 3, draw: 1, loss: 0 },
        rankingCriteria: stageData.rankingCriteria || ['points', 'goalDifference'],
        totalTeamsIn: stageData.totalTeamsIn,
        hasWildcards: stageData.hasWildcards || false,
        wildcardsCount: stageData.wildcardsCount || 0,
        hasBracket: brackets && brackets.length > 0,
        status: stageData.status || 'pending'
    });
    await stage.save({ session });

    let globalRound = 1;
    if (brackets && brackets.length) {
        for (const bracketData of brackets) {
            const bracket = new Bracket({
                TournamentItem: tournamentItemId,
                stageId: stage._id,
                type: bracketData.type,
                name: bracketData.name || `${stage.name} - ${bracketData.type === 'group' ? 'Group' : 'Knockout'}`,
                totalTeamsIn: bracketData.totalTeamsIn,
                group: []
            });
            await bracket.save({ session });

            if (bracketData.type === 'group') {
                if (!bracketData.groups || !Array.isArray(bracketData.groups) || bracketData.groups.length === 0) {
                    throw new Error('Missing groups data for group bracket');
                }
                for (const groupData of bracketData.groups) {
                    const group = new Group({
                        name: groupData.name,
                        tournamentItemId,
                        bracketId: bracket._id,
                        sport: '', // sẽ update sau
                        stageRuleId: stage._id,
                        status: 'pending',
                        matches: []
                    });
                    await group.save({ session });
                    bracket.group.push(group._id);
                    const numberOfTeams = groupData.numberOfTeams;
                    if (!numberOfTeams) throw new Error('Missing numberOfTeams for group');
                    const matches = await createRoundRobinMatches({
                        groupId: group._id,
                        tournamentItemId,
                        stageId: stage._id,
                        bracketId: bracket._id,
                        startRound: globalRound,
                        numberOfTeams,
                        session
                    });
                    group.matches = matches;
                    await group.save({ session });
                    const totalMatches = (numberOfTeams * (numberOfTeams - 1)) / 2;
                    globalRound += totalMatches;
                }
                await bracket.save({ session });
            } else if (bracketData.type === 'knockout') {
                const totalTeams = bracketData.totalTeamsIn;
                if (totalTeams < 2) throw new Error('Knockout bracket needs at least 2 teams');
                await createKnockoutMatches({
                    bracketId: bracket._id,
                    tournamentItemId,
                    stageId: stage._id,
                    totalTeams,
                    startRound: globalRound,
                    session
                });
                const rounds = Math.ceil(Math.log2(totalTeams));
                globalRound += rounds;
            }
        }
    }
    return stage;
};