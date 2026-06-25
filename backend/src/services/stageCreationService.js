// services/stageCreationService.js
import mongoose from 'mongoose';
import StageRule from '../models/rules/stageRules.js';
import Bracket from '../models/rules/brackets.js';
import Group from '../models/groups.js';
import Match from '../models/matches.js';

// ------------------ ROUND-ROBIN ------------------
function generateRoundRobinPairs(n) {
    const teams = Array.from({ length: n }, (_, i) => i);
    const rounds = [];
    if (n % 2 === 1) {
        teams.push(null);
        n++;
    }
    const half = n / 2;
    for (let round = 0; round < n - 1; round++) {
        const roundPairs = [];
        for (let i = 0; i < half; i++) {
            const a = teams[i];
            const b = teams[n - 1 - i];
            if (a !== null && b !== null) {
                roundPairs.push([a, b]);
            }
        }
        rounds.push(roundPairs);
        const last = teams.pop();
        teams.splice(1, 0, last);
    }
    return rounds;
}

async function createRoundRobinMatches({ groupId, tournamentItemId, stageId, bracketId, numberOfTeams, startRound, session }) {
    const pairs = generateRoundRobinPairs(numberOfTeams);
    const matches = [];
    let matchCounter = 0;
    for (let round = 0; round < pairs.length; round++) {
        const roundPairs = pairs[round];
        for (const [teamA, teamB] of roundPairs) {
            const match = new Match({
                tournamentItemId,
                stageId,
                bracketId,
                groupId,
                name: `Trận ${matchCounter + 1}`,
                round: startRound + round,
                status: 'pending',
                previousMatches: [],
                nextMatchId: null,
                winnerParticipantId: null,
                matchResultId: null
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

// ------------------ KNOCKOUT ------------------
function generateKnockoutBracket(teamCount) {
    const n = teamCount;
    const powerOfTwo = Math.pow(2, Math.ceil(Math.log2(n)));
    const byeCount = powerOfTwo - n;
    const byePositions = [];
    for (let i = 0; i < byeCount; i++) {
        byePositions.push(powerOfTwo - i);
    }

    const matches = [];
    let matchId = 0;

    function buildTree(start, end) {
        if (start === end) {
            return { position: start, isBye: byePositions.includes(start) };
        }
        const mid = Math.floor((start + end) / 2);
        const left = buildTree(start, mid);
        const right = buildTree(mid + 1, end);
        const match = {
            id: matchId++,
            left,
            right,
            round: 0,
            nextMatch: null
        };
        if (left.isBye && right.isBye) {
            throw new Error('Invalid bracket: two byes in same match');
        }
        return match;
    }

    const root = buildTree(1, powerOfTwo);
    const maxDepth = Math.ceil(Math.log2(powerOfTwo));

    function assignRounds(node, depth) {
        if (!node.left && !node.right) {
            return depth;
        }
        const leftDepth = assignRounds(node.left, depth + 1);
        const rightDepth = assignRounds(node.right, depth + 1);
        node.round = Math.min(leftDepth, rightDepth);
        return node.round;
    }
    assignRounds(root, 0);

    const matchList = [];
    function collect(node) {
        if (!node.left && !node.right) return;
        const matchDoc = {
            id: node.id,
            round: maxDepth - node.round,
            left: node.left,
            right: node.right,
            nextMatch: null
        };
        matchList.push(matchDoc);
        if (node.left && node.left.id !== undefined) {
            const leftMatch = matchList.find(m => m.id === node.left.id);
            if (leftMatch) leftMatch.nextMatch = node.id;
            collect(node.left);
        }
        if (node.right && node.right.id !== undefined) {
            const rightMatch = matchList.find(m => m.id === node.right.id);
            if (rightMatch) rightMatch.nextMatch = node.id;
            collect(node.right);
        }
    }
    collect(root);

    matchList.sort((a, b) => a.round - b.round);
    const matchMap = {};
    for (const m of matchList) matchMap[m.id] = m;

    for (const m of matchList) {
        if (m.nextMatch !== null) {
            const next = matchMap[m.nextMatch];
            m.nextMatch = next ? next.id : null;
        }
    }
    return matchList;
}

async function createKnockoutMatches({ bracketId, tournamentItemId, stageId, totalTeams, startRound, session }) {
    const matchList = generateKnockoutBracket(totalTeams);
    const matchIds = [];
    const matchMap = {};
    for (const m of matchList) {
        const match = new Match({
            tournamentItemId,
            stageId,
            bracketId,
            name: `Trận ${m.id + 1}`,
            round: startRound + m.round,
            status: 'pending',
            previousMatches: [],
            nextMatchId: null,
            winnerParticipantId: null,
            matchResultId: null
        });
        await match.save({ session });
        matchIds.push(match._id);
        matchMap[m.id] = match._id;
    }
    for (const m of matchList) {
        if (m.nextMatch !== null) {
            const nextId = matchMap[m.nextMatch];
            if (nextId) {
                const current = await Match.findById(matchMap[m.id]).session(session);
                current.nextMatchId = nextId;
                await current.save({ session });
                const next = await Match.findById(nextId).session(session);
                next.previousMatches.push({ matchId: matchMap[m.id], position: 'WINNER' });
                await next.save({ session });
            }
        }
    }
    return matchIds;
}

// ------------------ MAIN EXPORT ------------------
export const createStageWithBrackets = async ({ tournamentItemId, stageData, brackets, session }) => {
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
                const totalTeams = bracketData.totalTeamsIn;
                const numGroups = bracketData.groups.length;
                const teamsPerGroup = Math.ceil(totalTeams / numGroups);
                for (let i = 0; i < bracketData.groups.length; i++) {
                    const groupData = bracketData.groups[i];
                    const numberOfTeams = groupData.numberOfTeams || teamsPerGroup;
                    const group = new Group({
                        name: groupData.name || `Bảng ${String.fromCharCode(65 + i)}`,
                        tournamentItemId,
                        bracketId: bracket._id,
                        sport: '',
                        stageRuleId: stage._id,
                        status: 'pending',
                        matches: []
                    });
                    await group.save({ session });
                    bracket.group.push(group._id);
                    const matches = await createRoundRobinMatches({
                        groupId: group._id,
                        tournamentItemId,
                        stageId: stage._id,
                        bracketId: bracket._id,
                        numberOfTeams,
                        startRound: globalRound,
                        session
                    });
                    group.matches = matches;
                    await group.save({ session });
                    const roundsInGroup = numberOfTeams % 2 === 0 ? numberOfTeams - 1 : numberOfTeams;
                    globalRound += roundsInGroup;
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