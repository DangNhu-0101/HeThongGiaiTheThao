import mongoose from 'mongoose';
import Tournament from '../models/tournaments.js';
import BaseRule from '../models/rules/baseRules.js';
import StageRule from '../models/rules/stageRules.js';
import Bracket from '../models/rules/brackets.js';
import Group from '../models/groups.js';
import Team from '../models/teams.js';
import Match from '../models/matches.js';
import {
    getQualifiedTeamsFromGroupStage,
    createAllKnockoutMatches
} from '../utils/stageHelper.js';
import { assignTeamsToGroups } from '../utils/groupAssignerHelper.js';
import { createRoundRobinMatches } from '../utils/matchScheduleHelper.js';

const TEAM_STATUSES = ['pending', 'validated', 'confirmed', 'playing', 'Active'];

const getId = (value) => value?._id || value || null;
const getTeamDisplayName = (team) => team?.name || team?.teamName || 'Đội chưa đặt tên';

const resolveRuleContext = async ({ tournamentId, ruleId, baseRuleId, stageRuleId }, session) => {
    let baseRule = null;
    let stageRule = null;

    const requestedBaseRuleId = ruleId || baseRuleId;
    if (requestedBaseRuleId) {
        baseRule = await BaseRule.findById(requestedBaseRuleId)
            .populate('tournamentStructure.stages')
            .session(session)
            .lean();
    }

    if (stageRuleId) {
        stageRule = await StageRule.findById(stageRuleId).session(session).lean();
        if (!baseRule) {
            baseRule = await BaseRule.findOne({
                tournamentId,
                'tournamentStructure.stages': stageRuleId
            }).session(session).lean();
        }
    }

    if (!baseRule && !stageRule) {
        const tournament = await Tournament.findById(tournamentId).session(session).lean();
        const tournamentBaseRuleId = getId(tournament?.baseRule?.[0]);
        if (tournamentBaseRuleId) {
            baseRule = await BaseRule.findById(tournamentBaseRuleId)
                .populate('tournamentStructure.stages')
                .session(session)
                .lean();
        }
    }

    if (baseRule && !stageRule) {
        const populatedStage = baseRule.tournamentStructure?.stages?.[0];
        const resolvedStageRuleId = getId(populatedStage);
        stageRule = populatedStage?.stageName
            ? populatedStage
            : await StageRule.findById(resolvedStageRuleId).session(session).lean();
    }

    if (!stageRule) {
        stageRule = await StageRule.findOne({ tournamentId }).sort({ createdAt: -1 }).session(session).lean();
    }

    if (!stageRule) {
        throw new Error('Không tìm thấy cấu hình vòng đấu. Hãy tạo StageRule cho giải đấu trước.');
    }

    if (!baseRule) {
        baseRule = await BaseRule.findOne({
            tournamentId,
            $or: [
                { 'tournamentStructure.stages': stageRule._id },
                { sport: stageRule.sportType },
                { sportType: stageRule.sportType }
            ]
        }).session(session).lean();
    }

    return { baseRule, stageRule };
};

const normalizeStageRule = (stageRule) => {
    const groupStage = stageRule.stages?.find((stage) => stage.type === 'GROUP_STAGE')
        || (stageRule.type === 'GROUP_STAGE' ? stageRule : null)
        || stageRule.stages?.[0]
        || stageRule;

    const branches = groupStage.hasBranches && groupStage.branches?.length
        ? groupStage.branches
        : [{
            name: 'Nhánh chính',
            numberOfGroups: Number(groupStage.numberOfGroups || 1),
            playersPerGroup: Number(groupStage.playersPerGroup || 4),
            selectedRanks: groupStage.selectedRanks?.length ? groupStage.selectedRanks : [1, 2]
        }];

    return {
        ...stageRule,
        ...groupStage,
        _id: stageRule._id,
        sportType: stageRule.sportType || groupStage.sportType || groupStage.sport,
        branches,
        hasBranches: branches.length > 1 || Boolean(groupStage.hasBranches)
    };
};

const getKnockoutStages = (stageRule, stageConfig, qualifiedSlotCount) => {
    const directSubstages = stageRule.substages?.length ? stageRule.substages : stageConfig.substages || [];
    const knockoutStages = [
        ...directSubstages.filter((stage) => stage.type === 'KNOCKOUT'),
        ...(stageRule.stages || []).filter((stage) => stage.type === 'KNOCKOUT')
    ];

    if (knockoutStages.length) return knockoutStages;

    return [{
        _id: `${stageRule._id}-knockout`,
        stageName: 'Vòng knock-out',
        knockoutRound: 'Vòng knock-out',
        type: 'KNOCKOUT',
        totalTeamsIn: Math.max(2, qualifiedSlotCount || 2),
        matchDuration: stageConfig.matchDuration || 60,
        substages: []
    }];
};

const buildGroupSeeds = (stageConfig, tournamentId, bracketId) => {
    const groups = [];
    const sportType = stageConfig.sportType || stageConfig.sport || 'Other';
    let globalGroupIndex = 0;

    stageConfig.branches.forEach((branch, branchIndex) => {
        const numberOfGroups = Number(branch.numberOfGroups || 1);
        for (let groupIndex = 0; groupIndex < numberOfGroups; groupIndex += 1) {
            globalGroupIndex += 1;
            const groupCode = `R1-B${branchIndex + 1}-G${groupIndex + 1}`;
            const plainGroupName = `Bảng ${String.fromCharCode(64 + globalGroupIndex)}`;
            const hasNamedBranch = branch.name && branch.name !== 'Nhánh chính';
            groups.push({
                name: hasNamedBranch ? `${branch.name} - ${plainGroupName}` : plainGroupName,
                groupCode,
                branchName: branch.name || 'Nhánh chính',
                branchIndex: branchIndex + 1,
                groupIndex: groupIndex + 1,
                playersPerGroup: Number(branch.playersPerGroup || 4),
                selectedRanks: branch.selectedRanks?.length ? branch.selectedRanks : [1, 2],
                tournamentId,
                bracketId,
                sport: sportType,
                stageRuleId: stageConfig._id,
                teamInGroup: [],
                standings: [],
                status: 'pending'
            });
        }
    });

    return groups;
};

const buildGroupSlotEntries = (group, assignedTeamIds = [], teamById = new Map(), startNumber = 1) => {
    return Array.from({ length: group.playersPerGroup || Math.max(assignedTeamIds.length, 2) }, (_, index) => {
        const rank = index + 1;
        const teamId = assignedTeamIds[index] || null;
        const team = teamId ? teamById.get(teamId.toString()) : null;
        const placeholderName = `Team ${startNumber + index}`;
        return {
            teamId,
            placeholderName,
            name: team ? getTeamDisplayName(team) : placeholderName,
            slotCode: `${group.groupCode}-P${rank}`,
            sourceLabel: `${group.name} / Vị trí ${rank}`,
            rank
        };
    });
};

const buildStandingRows = (slotEntries) => slotEntries.map((slot) => ({
    teamId: slot.teamId,
    slotCode: slot.slotCode,
    placeholderName: slot.placeholderName,
    sourceLabel: slot.sourceLabel,
    rank: slot.rank,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0
}));

const buildKnockoutSeedEntries = (stageConfig, groupsForClient) => {
    const byBranch = {};
    stageConfig.branches.forEach((branch, branchIndex) => {
        const branchName = branch.name || 'Nhánh chính';
        const selectedRanks = branch.selectedRanks?.length ? branch.selectedRanks : [1, 2];
        const branchGroups = groupsForClient.filter((group) => group.branchIndex === branchIndex + 1);
        byBranch[branchName] = [];

        selectedRanks.forEach((rank) => {
            branchGroups.forEach((group) => {
                const standing = group.standings?.find((row) => row.rank === rank);
                if (standing) {
                    byBranch[branchName].push({
                        teamId: standing.teamId || null,
                        placeholderName: standing.placeholderName || `Team ${rank}`,
                        name: standing.placeholderName || `Team ${rank}`,
                        slotCode: standing.slotCode,
                        groupName: group.name,
                        rank
                    });
                }
            });
        });
    });

    return byBranch;
};

const findTeamsForSport = async (tournamentId, sportType, session) => {
    const filter = {
        tournamentId,
        status: { $in: TEAM_STATUSES }
    };

    const sportTeams = await Team.find({ ...filter, sportCategory: sportType }).session(session).lean();
    if (sportTeams.length) return sportTeams;

    return Team.find(filter).session(session).lean();
};

const toClientMatch = (match, teamMap) => {
    const team1Id = match.team1?.toString?.() || match.team1;
    const team2Id = match.team2?.toString?.() || match.team2;

    return {
        _id: match._id,
        matchNumber: match.matchNumber,
        round: match.round,
        roundName: match.roundName,
        matchName: match.matchName,
        teamA: teamMap.get(team1Id) || null,
        teamB: teamMap.get(team2Id) || null,
        team1Name: match.team1Name,
        team2Name: match.team2Name,
        team1SlotCode: match.team1SlotCode,
        team2SlotCode: match.team2SlotCode,
        slotCode: match.slotCode,
        winnerTarget: match.winnerTarget,
        loserTarget: match.loserTarget,
        nextMatchNumber: match.nextMatchNumber,
        nextMatchSide: match.nextMatchSide,
        scheduledStartTime: match.scheduledStartTime,
        courtName: match.courtName,
        status: match.status,
        scoreA: match.team1Score,
        scoreB: match.team2Score,
        matchType: match.matchType
    };
};

const buildClientGroups = async (groups, matches, session) => {
    const allTeamIds = [
        ...groups.flatMap((group) => group.teamInGroup || []),
        ...matches.flatMap((match) => [match.team1, match.team2].filter(Boolean))
    ];
    let teamQuery = Team.find({ _id: { $in: allTeamIds } });
    if (session) teamQuery = teamQuery.session(session);
    const teams = await teamQuery.lean();
    const teamMap = new Map(teams.map((team) => [team._id.toString(), {
        _id: team._id,
        name: getTeamDisplayName(team),
        logo: team.logo
    }]));

    return groups.map((group) => ({
        _id: group._id,
        name: group.name,
        groupCode: group.groupCode,
        teams: (group.teamInGroup || []).map((teamId) => teamMap.get(teamId.toString())).filter(Boolean),
        standings: group.standings || [],
        matches: matches
            .filter((match) => match.groupId?.toString() === group._id.toString())
            .map((match) => toClientMatch(match, teamMap))
    }));
};

const attachNextMatchIds = async (matches, session) => {
    const byNumber = new Map(matches.map((match) => [match.matchNumber, match]));
    const operations = matches
        .filter((match) => match.nextMatchNumber && byNumber.has(match.nextMatchNumber))
        .map((match) => ({
            updateOne: {
                filter: { _id: match._id },
                update: { nextMatchId: byNumber.get(match.nextMatchNumber)._id }
            }
        }));

    if (operations.length) await Match.bulkWrite(operations, { session });
};

export const initializeTournamentFromStageRule = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { tournamentId } = req.params;
        const { stageRuleId, ruleId, baseRuleId, method = 'random', startTime, courts = [], matchDuration } = req.body;

        const { baseRule, stageRule } = await resolveRuleContext({ tournamentId, ruleId, baseRuleId, stageRuleId }, session);
        const stageConfig = normalizeStageRule(stageRule);
        const sportType = stageConfig.sportType || baseRule?.sport || baseRule?.sportType || 'Other';
        const ruleObjectId = baseRule?._id || stageRule._id;
        const tournament = await Tournament.findById(tournamentId).session(session).lean();
        const scheduleStart = new Date(startTime || tournament?.timeLine?.tournamentStart || Date.now());
        const courtList = courts.length ? courts : ['Sân 1'];
        const matchDurationMinutes = Number(matchDuration || stageConfig.matchDuration || 60);

        const existingBrackets = await Bracket.find({ tournamentId, sport: sportType }).session(session).lean();
        const existingBracketIds = existingBrackets.map((bracket) => bracket._id);
        if (existingBracketIds.length) {
            await Match.deleteMany({ bracketId: { $in: existingBracketIds } }).session(session);
            await Group.deleteMany({ bracketId: { $in: existingBracketIds } }).session(session);
            await Bracket.deleteMany({ _id: { $in: existingBracketIds } }).session(session);
        }

        const [bracket] = await Bracket.create([{
            tournamentId,
            stageId: stageRule._id,
            sport: sportType,
            name: `${sportType} - Khung thi đấu`,
            numberOfGroup: 0,
            groups: [],
            totalTeams: 0,
            status: 'pending'
        }], { session });

        const teams = await findTeamsForSport(tournamentId, sportType, session);
        const teamIds = teams.map((team) => team._id);
        const teamById = new Map(teams.map((team) => [team._id.toString(), team]));

        const groupDocs = buildGroupSeeds(stageConfig, tournamentId, bracket._id);
        const groups = await Group.insertMany(groupDocs, { session });
        const assignedGroups = teamIds.length
            ? await assignTeamsToGroups(teamIds, groups.length, method)
            : Array.from({ length: groups.length }, () => []);

        let groupMatches = [];
        let globalMatchCount = 0;
        let globalSlotNumber = 1;
        const groupsForClient = [];

        for (let i = 0; i < groups.length; i++) {
            const rawGroup = groupDocs[i];
            const assignedTeamIds = assignedGroups[i] || [];
            const slotEntries = buildGroupSlotEntries(rawGroup, assignedTeamIds, teamById, globalSlotNumber);
            globalSlotNumber += slotEntries.length;
            const standings = buildStandingRows(slotEntries);
            const teamInGroup = assignedTeamIds.filter(Boolean);

            await Group.findByIdAndUpdate(groups[i]._id, {
                teamInGroup,
                standings
            }, { session });

            if (teamInGroup.length) {
                await Team.updateMany({ _id: { $in: teamInGroup } }, { group: groups[i].name }, { session });
            }

            const matchesForGroup = createRoundRobinMatches(
                slotEntries,
                groups[i]._id,
                tournamentId,
                bracket._id,
                stageRule._id,
                sportType,
                ruleObjectId,
                { groupCode: rawGroup.groupCode }
            );

            matchesForGroup.forEach((match) => {
                const matchOffset = globalMatchCount * matchDurationMinutes * 60 * 1000;
                match.scheduledStartTime = new Date(scheduleStart.getTime() + matchOffset);
                match.courtName = courtList[globalMatchCount % courtList.length];
                match.matchNumber = globalMatchCount + 1;
                match.slotCode = `${rawGroup.groupCode}-M${match.matchNumber}`;
                globalMatchCount++;
            });

            groupMatches = groupMatches.concat(matchesForGroup);
            groupsForClient.push({
                ...groups[i].toObject(),
                ...rawGroup,
                _id: groups[i]._id,
                teamInGroup,
                standings
            });
        }

        const knockoutSeedEntries = buildKnockoutSeedEntries(stageConfig, groupsForClient);
        const qualifiedSlotCount = Object.values(knockoutSeedEntries).reduce((sum, slots) => sum + slots.length, 0);
        const knockoutStages = getKnockoutStages(stageRule, stageConfig, qualifiedSlotCount);
        const knockoutMatches = createAllKnockoutMatches(
            knockoutStages,
            knockoutSeedEntries,
            {
                tournamentId,
                bracketId: bracket._id,
                stageRuleId: stageRule._id,
                sportType,
                ruleId: ruleObjectId,
                startTime: startTime || new Date(),
                courts: courtList,
                matchDuration: matchDurationMinutes
            }
        );

        const savedGroupMatches = groupMatches.length ? await Match.insertMany(groupMatches, { session }) : [];
        const savedKnockoutMatches = knockoutMatches.length ? await Match.insertMany(knockoutMatches, { session }) : [];
        await attachNextMatchIds(savedKnockoutMatches, session);

        await Bracket.findByIdAndUpdate(bracket._id, {
            numberOfGroup: groups.length,
            groups: groups.map(g => g._id),
            totalTeams: Math.max(teams.length, groupDocs.reduce((sum, group) => sum + group.playersPerGroup, 0))
        }, { session });

        await session.commitTransaction();

        const clientGroups = await buildClientGroups(groupsForClient, savedGroupMatches);

        return res.status(200).json({
            success: true,
            message: 'Đã tạo sẵn bảng, slot Team 1, Team 2 và nhánh knock-out theo cấu hình đã lưu.',
            data: {
                bracketId: bracket._id,
                groups: clientGroups,
                knockoutMatches: savedKnockoutMatches
            }
        });
    } catch (error) {
        if (session.inTransaction()) await session.abortTransaction();
        console.error('initializeTournamentFromStageRule Error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi hệ thống trong quá trình khởi tạo khung giải đấu'
        });
    } finally {
        session.endSession();
    }
};

export const previewQualifiedTeams = async (req, res) => {
    try {
        const { tournamentId } = req.params;
        const { sportType, stageRuleId, ruleId, baseRuleId } = req.query;
        const { baseRule, stageRule } = await resolveRuleContext({ tournamentId, stageRuleId, ruleId, baseRuleId });
        const stageConfig = normalizeStageRule(stageRule);
        const resolvedSportType = sportType || stageConfig.sportType || baseRule?.sport || baseRule?.sportType;

        const filter = { tournamentId };
        if (resolvedSportType) filter.sport = resolvedSportType;

        const groups = await Group.find(filter).populate('teamInGroup', 'name logo').lean();
        if (!groups.length) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin bảng đấu.' });
        }

        const qualifiedData = getQualifiedTeamsFromGroupStage(stageConfig, groups);

        return res.status(200).json({
            success: true,
            data: { qualifiedTeams: qualifiedData }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const advanceToKnockoutStage = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { tournamentId } = req.params;
        const { stageRuleId, ruleId, baseRuleId } = req.body;

        const { baseRule, stageRule } = await resolveRuleContext({ tournamentId, stageRuleId, ruleId, baseRuleId }, session);
        const stageConfig = normalizeStageRule(stageRule);
        const sportType = stageConfig.sportType || baseRule?.sport || baseRule?.sportType || 'Other';

        const groups = await Group.find({ tournamentId, sport: sportType }).session(session).lean();
        const qualifiedTeams = getQualifiedTeamsFromGroupStage(stageConfig, groups);
        const qualifiedBySlot = new Map();

        Object.values(qualifiedTeams).flat().forEach((entry) => {
            if (entry.slotCode) qualifiedBySlot.set(entry.slotCode, entry);
        });

        const firstRound = await Match.find({ tournamentId, sportType, matchType: 'knockout' })
            .sort({ round: 1, matchNumber: 1 })
            .session(session);
        const firstRoundNumber = firstRound[0]?.round;
        const firstRoundMatches = firstRound.filter((match) => match.round === firstRoundNumber);

        for (const match of firstRoundMatches) {
            const left = qualifiedBySlot.get(match.team1SlotCode);
            const right = qualifiedBySlot.get(match.team2SlotCode);
            if (left?.teamId) {
                match.team1 = left.teamId;
                match.team1Name = left.placeholderName || match.team1Name;
            }
            if (right?.teamId) {
                match.team2 = right.teamId;
                match.team2Name = right.placeholderName || match.team2Name;
            }
            await match.save({ session });
        }

        await session.commitTransaction();

        const matches = await Match.find({ tournamentId, sportType, matchType: 'knockout' })
            .populate('team1 team2 winnerTeamId', 'name logo')
            .sort({ matchNumber: 1 })
            .lean();

        return res.status(200).json({
            success: true,
            message: 'Đã thay đội thật vào nhánh knock-out theo đúng luồng slot ban đầu.',
            data: {
                matches,
                qualifiedTeams
            }
        });
    } catch (error) {
        await session.abortTransaction();
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

export const publishGroupStage = async (req, res) => {
    try {
        const { tournamentId } = req.params;
        await Group.updateMany({ tournamentId }, { status: 'progress' });
        await Match.updateMany({ tournamentId, matchType: 'group' }, { isPublished: true });
        return res.status(200).json({ success: true, message: 'Đã công khai danh sách bảng đấu.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const publishKnockoutStage = async (req, res) => {
    try {
        const { tournamentId } = req.params;
        await Bracket.updateMany({ tournamentId }, { status: 'progress' });
        await Match.updateMany({ tournamentId, matchType: 'knockout' }, { isPublished: true });
        return res.status(200).json({ success: true, message: 'Đã công khai vòng loại trực tiếp.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
