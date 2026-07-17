// controllers/stageController.js
import mongoose from 'mongoose';
import { createStageWithBrackets } from '../services/stageCreationService.js';
import TournamentItem from '../models/tournamentItem.js';
import CategoryRule from '../models/rules/categories.js';
import User from '../models/users.js';
import StageRule from '../models/rules/stageRules.js';
import Bracket from '../models/rules/brackets.js';
import Group from '../models/groups.js';
import Match from '../models/matches.js';
import MatchResult from '../models/matchResults.js';
import Participant from '../models/participants.js';
import Standing from '../models/standings.js';
import TournamentTemplate from '../models/rules/ruleTemplate/tournamentTemplate.js';
import { checkTournamentItemPermission } from '../utils/tournamentHelper.js';
import { syncMatchesFromCompetitionConfig } from './matchController.js';

const normalizeSelectedType = (value) => {
    if (value === 'preset' || value === 'template' || value === 'custom') return value;
    return 'custom';
};

const canUseFormatFallback = (req) => {
    const roles = Array.isArray(req.userRoles) ? req.userRoles : [];
    return roles.some((role) => ['admin', 'org', 'organization'].includes(role));
};

const sameSportType = (left, right) => String(left || '').trim().toLowerCase() === String(right || '').trim().toLowerCase();

const isPowerOfTwo = (value) => value > 0 && (value & (value - 1)) === 0;

const normalizeId = (value) => String(value?._id || value || '');

export const getApprovedEligibleTeamsCount = async (tournamentItemId, session = null) => {
    const query = Participant.find({
        tournamentItemId,
        type: 'team',
        registrationStatus: { $nin: ['rejected', 'suspended'] },
        $or: [
            { registrationStatus: 'approved' },
            { paymentStatus: 'exempted' },
        ],
    }).select('_id name slug registrationStatus paymentStatus lineup skill seed rank ranking createdAt').populate('lineup.Player', 'name skill status').lean();
    if (session) query.session(session);
    const participants = await query;
    const unique = new Map();
    participants.forEach((participant) => {
        const id = normalizeId(participant._id);
        if (!id || unique.has(id)) return;
        unique.set(id, participant);
    });
    return {
        totalTeams: unique.size,
        teamIds: [...unique.keys()],
        teams: [...unique.values()],
    };
};

const groupNameForIndex = (index) => `Bảng ${String.fromCharCode(65 + index)}`;

const groupKeyForIndex = (index) => String.fromCharCode(65 + index);

const isLuckyLabel = (value) => /^Lucky\d+$/i.test(String(value || '').trim());

const evenSlotCount = (value) => {
    const safe = Math.max(2, Number(value) || 2);
    return safe % 2 === 0 ? safe : safe + 1;
};

const splitEvenSlotCounts = (totalSlots, partCount, preferredCounts = []) => {
    const count = Math.max(1, Number(partCount) || 1);
    const safeTotal = Math.max(0, Math.trunc(Number(totalSlots) || 0));
    if (safeTotal <= 0) return Array.from({ length: count }, () => 0);
    const preferredTotal = preferredCounts.reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0);
    if (preferredTotal === totalSlots && preferredCounts.length >= count) {
        return preferredCounts.slice(0, count).map((value) => value > 0 ? evenSlotCount(value) : 0);
    }
    const activeCount = Math.min(count, Math.max(1, Math.floor(evenSlotCount(safeTotal) / 2)));
    let remaining = evenSlotCount(safeTotal);
    return Array.from({ length: count }, (_, index) => {
        if (index >= activeCount) return 0;
        if (index === activeCount - 1) return Math.max(0, remaining);
        const remainingParts = activeCount - index;
        const minForRest = (remainingParts - 1) * 2;
        const balancedShare = Math.ceil((remaining / remainingParts) / 2) * 2;
        const share = Math.max(2, Math.min(balancedShare, remaining - minForRest));
        remaining = Math.max(0, remaining - share);
        return share;
    });
};

const reviveWildcardAddedMatches = (stage, branch) => {
    if (branch.type !== 'knockout') return branch;
    const flowSlots = Array.isArray(branch.flowSlots) ? branch.flowSlots : [];
    const wildcardSlotCount = flowSlots.filter((slot) => slot?.reservedForWildcard || isLuckyLabel(slot?.sourceLabel)).length;
    if (!wildcardSlotCount) return branch;

    const baseSlotCount = evenSlotCount(Math.max(
        2,
        flowSlots.filter((slot) => !slot?.reservedForWildcard && !isLuckyLabel(slot?.sourceLabel)).length,
        Number(branch.totalTeamsIn || 0) - wildcardSlotCount,
    ));
    const totalSlotCount = evenSlotCount(Math.max(flowSlots.length, Number(branch.totalTeamsIn || 0)));
    const previousDefaultMatchCount = Math.max(1, Math.ceil(baseSlotCount / 2));
    const nextDefaultMatchCount = Math.max(1, Math.ceil(totalSlotCount / 2));
    if (nextDefaultMatchCount <= previousDefaultMatchCount) return branch;

    const revivedIds = new Set(Array.from(
        { length: nextDefaultMatchCount - previousDefaultMatchCount },
        (_, index) => `${stage.id}:${branch.id}:m-${previousDefaultMatchCount + index + 1}`,
    ));
    branch.flowDeletedMatchIds = (Array.isArray(branch.flowDeletedMatchIds) ? branch.flowDeletedMatchIds : [])
        .filter((id) => !revivedIds.has(id));
    return branch;
};

const matchIdsForBranch = (stage, branch) => {
    if (branch.type !== 'knockout') return [];
    if (Number(branch.totalTeamsIn || 0) < 2) return [];
    reviveWildcardAddedMatches(stage, branch);
    const count = evenSlotCount(Math.max(
        Array.isArray(branch.flowSlots) ? branch.flowSlots.length : 0,
        Number(branch.totalTeamsIn) || 2,
    ));
    const deleted = new Set(Array.isArray(branch.flowDeletedMatchIds) ? branch.flowDeletedMatchIds : []);
    return Array.from({ length: Math.max(1, Math.ceil(count / 2)) }, (_, index) => `${stage.id}:${branch.id}:m-${index + 1}`)
        .filter((id) => !deleted.has(id));
};

const assignMatchCodes = (stages) => {
    const codes = new Map();
    let next = 1;
    stages.forEach((stage) => {
        (Array.isArray(stage.brackets) ? stage.brackets : []).forEach((branch) => {
            matchIdsForBranch(stage, branch).forEach((id) => {
                codes.set(id, `M${next}`);
                next += 1;
            });
            (Array.isArray(branch.flowStandaloneMatches) ? branch.flowStandaloneMatches : []).forEach((match) => {
                const code = String(match.matchCode || `M${next}`);
                codes.set(String(match.id), code);
                next += 1;
            });
        });
    });
    return codes;
};

const groupAdvanceLabels = (groupCount, ranks) => {
    const safeRanks = Array.isArray(ranks) && ranks.length ? ranks.map(Number).filter(Boolean) : [1];
    if (groupCount === 2 && safeRanks.includes(1) && safeRanks.includes(2)) {
        return ['A1', 'B2', 'A2', 'B1'];
    }
    const labels = [];
    safeRanks.forEach((rank) => {
        for (let index = 0; index < groupCount; index += 1) labels.push(`${groupKeyForIndex(index)}${rank}`);
    });
    return labels;
};

const createFlowSlots = (branch, totalTeamsIn, labels = [], metadata = []) => {
    const count = evenSlotCount(totalTeamsIn);
    return Array.from({ length: count }, (_, index) => ({
        id: `${branch.id}-slot-${index + 1}`,
        label: `Slot ${index + 1}`,
        ...(labels[index] ? { sourceLabel: labels[index] } : {}),
        ...(metadata[index] || {}),
    }));
};

const knockoutOutputCount = (stage) => (Array.isArray(stage.brackets) ? stage.brackets : [])
    .filter((branch) => branch.type === 'knockout')
    .reduce((sum, branch) => sum + matchIdsForBranch(stage, branch).length, 0);

const groupOutputLabels = (stage) => {
    const labels = [];
    (Array.isArray(stage.brackets) ? stage.brackets : []).forEach((branch) => {
        if (branch.type !== 'group') return;
        const groups = Array.isArray(branch.groups) ? branch.groups : [];
        const ranks = branch.selection?.ranks?.length ? branch.selection.ranks : [1];
        labels.push(...groupAdvanceLabels(groups.length || 1, ranks));
    });
    if (stage?.wildcard?.enabled) {
        const slots = Number(stage.wildcard.selection?.slots || stage.wildcard.slots || 0);
        for (let index = 0; index < slots; index += 1) labels.push(`Lucky${index + 1}`);
    }
    return labels;
};

const previousKnockoutSources = (stage, matchCodes) => {
    const sources = [];
    (Array.isArray(stage.brackets) ? stage.brackets : []).forEach((branch) => {
        if (branch.type !== 'knockout') return;
        matchIdsForBranch(stage, branch).forEach((matchId) => {
            sources.push({
                sourceMatchId: matchId,
                sourceLabel: matchCodes.get(matchId) || '',
                sourceStageId: stage.id,
                sourceResult: 'WINNER',
            });
        });
    });
    return sources;
};

const connectPreviousMatchesToBranch = (previousStage, currentStage, branch, matchCodes, branchSources = null) => {
    const sources = Array.isArray(branchSources) ? branchSources : previousKnockoutSources(previousStage, matchCodes);
    const targetMatchIds = matchIdsForBranch(currentStage, branch);
    const connections = [];
    const slots = createFlowSlots(
        branch,
        Math.max(2, sources.length),
        sources.map((source) => source.sourceLabel),
        sources.map((source) => ({
            sourceStageId: source.sourceStageId,
            sourceMatchId: source.sourceMatchId,
            sourceResult: source.sourceResult,
        })),
    );
    sources.forEach((source, index) => {
        const target = targetMatchIds[Math.floor(index / 2)];
        if (!target) return;
        const targetSlot = index % 2 === 0 ? 1 : 2;
        connections.push({
            id: `${source.sourceMatchId}->${target}:slot-${targetSlot}`,
            source: source.sourceMatchId,
            target,
            label: source.sourceLabel,
            output: source.sourceResult,
            targetSlot,
            targetSlotId: `${target}:slot-${targetSlot}`,
            sourceStageId: previousStage.id,
            targetStageId: currentStage.id,
        });
    });
    return { slots, connections };
};

const hasIncomingConnectionsForBranch = (stages, stage, branch) => {
    const targetIds = new Set(matchIdsForBranch(stage, branch));
    return stages.some((item) => (Array.isArray(item.brackets) ? item.brackets : []).some((itemBranch) =>
        (Array.isArray(itemBranch.flowConnections) ? itemBranch.flowConnections : [])
            .some((connection) => targetIds.has(String(connection.target || ''))),
    ));
};

const normalizeFlowConnectionSlots = (config) => {
    const occupiedByTarget = new Map();
    const seenConnections = new Set();
    (Array.isArray(config?.stages) ? config.stages : []).forEach((stage) => {
        (Array.isArray(stage.brackets) ? stage.brackets : []).forEach((branch) => {
            const normalized = [];
            (Array.isArray(branch.flowConnections) ? branch.flowConnections : []).forEach((connection) => {
                const source = String(connection.source || '');
                const target = String(connection.target || '');
                if (!source || !target) return;
                const output = String(connection.output || 'WINNER').toUpperCase() === 'LOSER' ? 'LOSER' : 'WINNER';
                const identity = `${source}->${target}:${output}`;
                if (seenConnections.has(identity)) return;
                seenConnections.add(identity);

                const occupied = occupiedByTarget.get(target) || new Set();
                const requestedSlot = Number(
                    connection.targetSlot
                    || String(connection.targetSlotId || '').match(/slot-(\d+)$/)?.[1]
                    || 0,
                );
                let targetSlot = requestedSlot === 1 || requestedSlot === 2 ? requestedSlot : 0;
                if (!targetSlot || occupied.has(targetSlot)) {
                    targetSlot = !occupied.has(1) ? 1 : !occupied.has(2) ? 2 : targetSlot;
                }
                if (targetSlot === 1 || targetSlot === 2) occupied.add(targetSlot);
                occupiedByTarget.set(target, occupied);
                normalized.push({
                    ...connection,
                    output,
                    targetSlot: targetSlot || undefined,
                    targetSlotId: targetSlot ? `${target}:slot-${targetSlot}` : connection.targetSlotId,
                });
            });
            branch.flowConnections = normalized;
        });
    });
};

const normalizeTemplateGroups = (branch, approvedTeamsCount) => {
    const existingGroups = Array.isArray(branch.groups) ? branch.groups : [];
    const configuredTeamsPerGroup = Number(branch.teamsPerGroup || branch.teamsPerGroupCount || existingGroups[0]?.numberOfTeams || 0);
    if (!configuredTeamsPerGroup || configuredTeamsPerGroup < 1) {
        const error = new Error(`Nhánh ${branch.name || branch.id || 'vòng bảng'} thiếu số đội mỗi bảng`);
        error.statusCode = 400;
        throw error;
    }
    const groupCount = Math.max(1, Math.ceil(approvedTeamsCount / configuredTeamsPerGroup));
    return Array.from({ length: groupCount }, (_, index) => {
        const remaining = Math.max(0, approvedTeamsCount - index * configuredTeamsPerGroup);
        const capacity = Math.min(configuredTeamsPerGroup, remaining || configuredTeamsPerGroup);
        const source = existingGroups[index] || {};
        return {
            ...source,
            id: source.id || `${branch.id || 'group'}-g-${index + 1}`,
            name: source.name || groupNameForIndex(index),
            numberOfTeams: Number(source.numberOfTeams || capacity || configuredTeamsPerGroup),
        };
    });
};

const normalizeFormatWithEligibleTeams = (competitionFormat, eligibleTeams) => {
    const config = competitionFormat.config || {};
    const stages = Array.isArray(config.stages) ? config.stages : [];
    let previousStage = null;
    stages.forEach((stage, stageIndex) => {
        stage.id = stage.id || `stage-${stageIndex + 1}`;
        stage.order = Number(stage.order || stageIndex + 1);
        stage.sourceType = stageIndex === 0 ? 'REGISTRATION' : 'PREVIOUS_STAGE';
        stage.sourceStageIds = stageIndex === 0 ? [] : [previousStage?.id].filter(Boolean);
        stage.input = stage.input && typeof stage.input === 'object' ? stage.input : {};
        if (stageIndex === 0) {
            stage.input.teams = eligibleTeams.totalTeams;
            stage.input.sourceStageId = '';
        } else {
            stage.input.sourceStageId = previousStage?.id || '';
        }
        stage.brackets = Array.isArray(stage.brackets) ? stage.brackets : [];

        stage.brackets.forEach((branch) => {
            branch.id = branch.id || `${stage.id}-main`;
            if (branch.type === 'group') {
                branch.totalTeamsIn = stageIndex === 0 ? eligibleTeams.totalTeams : Number(branch.totalTeamsIn || stage.input.teams || 0);
                branch.groups = normalizeTemplateGroups(branch, branch.totalTeamsIn);
                branch.groupIds = branch.groups.map((group) => group.id);
                stage.input.groups = branch.groups.length;
                stage.input.teamsPerGroup = Number(branch.groups[0]?.numberOfTeams || stage.input.teamsPerGroup || 0);
            } else if (branch.type === 'knockout') {
                const totalTeamsIn = Number(branch.totalTeamsIn || stage.input.teams || (stageIndex === 0 ? eligibleTeams.totalTeams : 0));
                if (stageIndex === 0 && !isPowerOfTwo(totalTeamsIn)) {
                    const error = new Error(`Số đội hợp lệ hiện tại (${totalTeamsIn}) không phù hợp với thể thức loại trực tiếp không hỗ trợ bye`);
                    error.statusCode = 400;
                    throw error;
                }
                branch.totalTeamsIn = totalTeamsIn;
                if (stageIndex === 0) stage.input.teams = totalTeamsIn;
            }
        });
        previousStage = stage;
    });
    config.stages = stages;
    config.stageCount = stages.length;
    competitionFormat.stageCount = stages.length;
    competitionFormat.config = config;
    return competitionFormat;
};

const normalizeFormatWithStartTeams = (competitionFormat, eligibleTeams) => {
    const config = competitionFormat.config || {};
    const stages = Array.isArray(config.stages) ? config.stages : [];
    const startTeams = Number(eligibleTeams.totalTeams || 0);
    let previousStage = null;

    stages.forEach((stage, stageIndex) => {
        stage.id = stage.id || `stage-${stageIndex + 1}`;
        stage.order = Number(stage.order || stageIndex + 1);
        stage.sourceType = stageIndex === 0 ? 'REGISTRATION' : 'PREVIOUS_STAGE';
        stage.sourceStageIds = stageIndex === 0 ? [] : [previousStage?.id].filter(Boolean);
        stage.input = stage.input && typeof stage.input === 'object' ? stage.input : {};
        stage.input.selection = stage.input.selection && typeof stage.input.selection === 'object'
            ? stage.input.selection
            : { mode: stageIndex === 0 ? 'MANUAL' : 'WINNER', slots: 0, ranks: [], manualTeamIds: [] };

        if (stageIndex === 0) {
            stage.input.teams = startTeams;
            stage.input.sourceStageId = '';
        } else {
            const previousGroupLabels = previousStage ? groupOutputLabels(previousStage) : [];
            const previousKnockoutTeams = previousStage ? knockoutOutputCount(previousStage) : 0;
            const inheritedTeams = previousKnockoutTeams || previousGroupLabels.length || Number(stage.input.teams || 0);
            stage.input.teams = inheritedTeams;
            stage.input.sourceStageId = previousStage?.id || '';
            stage.input.selection.slots = inheritedTeams;
        }

        stage.brackets = Array.isArray(stage.brackets) ? stage.brackets : [];
        const previousGroupLabelsForStage = previousStage ? groupOutputLabels(previousStage) : [];
        const previousKnockoutTeamsForStage = previousStage ? knockoutOutputCount(previousStage) : 0;
        const knockoutBranchesForStage = stage.brackets.filter((branch) => branch.type === 'knockout');
        const knockoutInputCounts = splitEvenSlotCounts(
            stageIndex === 0 ? startTeams : Number(previousKnockoutTeamsForStage || previousGroupLabelsForStage.length || stage.input.teams || 0),
            Math.max(1, knockoutBranchesForStage.length),
            knockoutBranchesForStage.map((branch) => Number(branch.totalTeamsIn || 0)),
        );
        let knockoutIndex = 0;
        let groupLabelOffset = 0;
        stage.brackets.forEach((branch) => {
            branch.id = branch.id || `${stage.id}-main`;
            branch.selection = branch.selection && typeof branch.selection === 'object'
                ? branch.selection
                : { mode: branch.type === 'group' ? 'TOP_RANKS' : 'WINNER', slots: 0, ranks: branch.type === 'group' ? [1, 2] : [], manualTeamIds: [] };

            if (branch.type === 'group') {
                branch.totalTeamsIn = stageIndex === 0 ? startTeams : Number(stage.input.teams || branch.totalTeamsIn || 0);
                branch.groups = normalizeTemplateGroups(branch, branch.totalTeamsIn);
                branch.groupIds = branch.groups.map((group) => group.id);
                stage.input.groups = branch.groups.length;
                stage.input.teamsPerGroup = Number(branch.groups[0]?.numberOfTeams || stage.input.teamsPerGroup || 0);
                branch.selection.slots = branch.groups.length * (branch.selection.ranks?.length || 1);
                return;
            }

            if (branch.type !== 'knockout') return;
            const hasConfiguredFlow = branch.flowConnectionsConfigured === true;
            const previousGroupLabels = previousStage ? groupOutputLabels(previousStage) : [];
            const previousKnockoutTeams = previousStage ? knockoutOutputCount(previousStage) : 0;
            const configuredBranchTeamsIn = Number(branch.totalTeamsIn || 0);
            const branchTeamsIn = configuredBranchTeamsIn > 0
                ? configuredBranchTeamsIn
                : knockoutInputCounts[knockoutIndex] || Number(stage.input.teams || 0);
            knockoutIndex += 1;
            const totalTeamsIn = stageIndex === 0
                ? startTeams
                : branchTeamsIn;

            if (stageIndex === 0 && !isPowerOfTwo(totalTeamsIn)) {
                const error = new Error(`So doi bat dau (${totalTeamsIn}) khong phu hop voi template knockout khong ho tro bye`);
                error.statusCode = 400;
                throw error;
            }
            if (stageIndex > 0 && previousKnockoutTeams && totalTeamsIn > 2 && totalTeamsIn % 2 !== 0) {
                const error = new Error(`Stage truoc co ${totalTeamsIn} doi di tiep, khong the tu noi knockout vi so luong le`);
                error.statusCode = 400;
                throw error;
            }

            branch.totalTeamsIn = totalTeamsIn;
            branch.selection.slots = Math.max(1, Math.ceil(totalTeamsIn / 2));
            if (stageIndex === 0) {
                stage.input.teams = totalTeamsIn;
                if (!hasConfiguredFlow) {
                    branch.flowSlots = createFlowSlots(branch, totalTeamsIn);
                    branch.flowConnections = [];
                }
            } else if (previousGroupLabels.length && !previousKnockoutTeams) {
                groupLabelOffset += totalTeamsIn;
                if (!hasConfiguredFlow) {
                    const labels = previousGroupLabels.slice(groupLabelOffset - totalTeamsIn, groupLabelOffset);
                    branch.flowSlots = createFlowSlots(
                        branch,
                        totalTeamsIn,
                        labels,
                        labels.map((label) => ({
                            sourceStageId: previousStage.id,
                            sourceGroupName: label.match(/^[A-Z]+/)?.[0],
                            sourceRank: Number(label.match(/\d+$/)?.[0] || 0) || undefined,
                        })),
                    );
                    branch.flowConnections = [];
                }
            }
        });
        previousStage = stage;
    });

    const matchCodes = assignMatchCodes(stages);
    stages.forEach((stage, stageIndex) => {
        if (stageIndex === 0) return;
        const previous = stages[stageIndex - 1];
        const previousKnockoutTeams = knockoutOutputCount(previous);
        if (!previousKnockoutTeams) return;
        const previousStageHasConfiguredFlow = (Array.isArray(previous.brackets) ? previous.brackets : [])
            .some((branch) => branch.type === 'knockout' && branch.flowConnectionsConfigured === true);
        const sources = previousKnockoutSources(previous, matchCodes);
        let sourceOffset = 0;
        (Array.isArray(stage.brackets) ? stage.brackets : []).forEach((branch) => {
            if (branch.type !== 'knockout') return;
            const preserveConfiguredFlow = branch.flowConnectionsConfigured === true
                || previousStageHasConfiguredFlow
                || hasIncomingConnectionsForBranch(stages, stage, branch);
            if (preserveConfiguredFlow) {
                sourceOffset += Math.min(
                    Math.max(0, Number(branch.totalTeamsIn || 0)),
                    Math.max(0, sources.length - sourceOffset),
                );
                return;
            }
            const branchSourceCount = Math.min(
                Math.max(0, Number(branch.totalTeamsIn || 0)),
                Math.max(0, sources.length - sourceOffset),
            );
            const branchSources = sources.slice(sourceOffset, sourceOffset + branchSourceCount);
            sourceOffset += branchSourceCount;
            const { slots, connections } = connectPreviousMatchesToBranch(previous, stage, branch, matchCodes, branchSources);
            branch.flowSlots = slots;
            branch.flowConnections = connections;
        });
    });

    config.stages = stages;
    config.stageCount = stages.length;
    competitionFormat.stageCount = stages.length;
    competitionFormat.config = config;
    return competitionFormat;
};

const validateCompetitionTemplateSource = async (competitionFormat, item) => {
    if (!['preset', 'template'].includes(competitionFormat.selectedType) || competitionFormat.presetSource !== 'competition-template') return;
    if (!mongoose.Types.ObjectId.isValid(competitionFormat.presetId)) {
        const error = new Error('Mã thể thức mẫu không hợp lệ');
        error.statusCode = 400;
        throw error;
    }
    const template = await TournamentTemplate.findOne({
        _id: competitionFormat.presetId,
        status: 'actived',
        isActive: { $ne: false },
    }).lean();
    if (!template) {
        const error = new Error('Không tìm thấy thể thức mẫu đang hoạt động');
        error.statusCode = 404;
        throw error;
    }
    const tournamentSport = item.sportType || competitionFormat.sportType;
    if (tournamentSport && !sameSportType(template.sportType, tournamentSport)) {
        const error = new Error('Thể thức mẫu không phù hợp với môn thi đấu của giải');
        error.statusCode = 400;
        throw error;
    }
};

const defaultMatchIdsForBranch = (stage, branch) => {
    if (branch.type !== 'knockout') return [];
    if (Number(branch.totalTeamsIn || 0) < 2) return [];
    reviveWildcardAddedMatches(stage, branch);
    const totalTeamsIn = Math.max(2, Number(branch.totalTeamsIn) || 2);
    const slotCount = totalTeamsIn % 2 === 0 ? totalTeamsIn : totalTeamsIn + 1;
    const deleted = new Set(Array.isArray(branch.flowDeletedMatchIds) ? branch.flowDeletedMatchIds : []);
    return Array.from({ length: Math.max(1, Math.ceil(slotCount / 2)) }, (_, index) => `${stage.id}:${branch.id}:m-${index + 1}`)
        .filter((id) => !deleted.has(id));
};

const validateNoCycle = (nodes, edges) => {
    const graph = new Map(nodes.map((node) => [node, []]));
    edges.forEach((edge) => {
        if (!graph.has(edge.source)) graph.set(edge.source, []);
        graph.get(edge.source).push(edge.target);
    });
    const visiting = new Set();
    const visited = new Set();
    const visit = (node) => {
        if (visiting.has(node)) return false;
        if (visited.has(node)) return true;
        visiting.add(node);
        for (const next of graph.get(node) || []) {
            if (!visit(next)) return false;
        }
        visiting.delete(node);
        visited.add(node);
        return true;
    };
    return nodes.every(visit);
};

const validateCompetitionFormatConfig = (config = {}) => {
    const stages = Array.isArray(config.stages) ? config.stages : [];
    if (!stages.length) {
        const error = new Error('Cấu hình thể thức cần ít nhất một stage');
        error.statusCode = 400;
        throw error;
    }

    const allMatchIds = new Set();
    const allMatchCodes = new Set();
    const allEdges = [];

    stages.forEach((stage, stageIndex) => {
        if (!stage.id) {
            const error = new Error(`Stage ${stageIndex + 1} thiếu mã nội bộ`);
            error.statusCode = 400;
            throw error;
        }
        const brackets = Array.isArray(stage.brackets) ? stage.brackets : [];
        if (!brackets.length) {
            const error = new Error(`Stage ${stage.name || stage.id} cần ít nhất một nhánh`);
            error.statusCode = 400;
            throw error;
        }

        brackets.forEach((branch) => {
            if (branch.type === 'group') {
                const groups = Array.isArray(branch.groups) ? branch.groups : [];
                const capacity = groups.reduce((sum, group) => sum + Number(group.numberOfTeams || 0), 0);
                if (capacity < Number(branch.totalTeamsIn || 0)) {
                    const error = new Error(`Sức chứa bảng của ${branch.name || branch.id} nhỏ hơn số đội đầu vào`);
                    error.statusCode = 400;
                    throw error;
                }
                return;
            }

            const defaultIds = defaultMatchIdsForBranch(stage, branch);
            defaultIds.forEach((id, index) => {
                if (allMatchIds.has(id)) {
                    const error = new Error(`Trùng mã trận ${id}`);
                    error.statusCode = 400;
                    throw error;
                }
                allMatchIds.add(id);
                allMatchCodes.add(`M${allMatchCodes.size + 1 || index + 1}`);
            });

            (Array.isArray(branch.flowStandaloneMatches) ? branch.flowStandaloneMatches : []).forEach((match) => {
                const matchId = String(match.id || '');
                if (!matchId) {
                    const error = new Error(`Nhánh ${branch.name || branch.id} có trận thiếu key`);
                    error.statusCode = 400;
                    throw error;
                }
                if (allMatchIds.has(matchId)) {
                    const error = new Error(`Trùng key trận ${matchId}`);
                    error.statusCode = 400;
                    throw error;
                }
                const code = String(match.matchCode || '').trim();
                if (code && allMatchCodes.has(code)) {
                    const error = new Error(`Trùng mã hiển thị trận ${code}`);
                    error.statusCode = 400;
                    throw error;
                }
                allMatchIds.add(matchId);
                if (code) allMatchCodes.add(code);
                const seedSlots = Array.isArray(match.seedSlots) ? match.seedSlots : [];
                if (seedSlots.length < 2) {
                    const error = new Error(`Trận ${code || matchId} thiếu đầu vào bắt buộc`);
                    error.statusCode = 400;
                    throw error;
                }
            });

            (Array.isArray(branch.flowConnections) ? branch.flowConnections : []).forEach((connection) => {
                allEdges.push({
                    source: String(connection.source || ''),
                    target: String(connection.target || ''),
                    id: String(connection.id || ''),
                    targetSlot: Number(connection.targetSlot || String(connection.targetSlotId || '').match(/slot-(\d+)$/)?.[1] || 0),
                });
            });
        });
    });

    allEdges.forEach((edge) => {
        if (!allMatchIds.has(edge.source) || !allMatchIds.has(edge.target)) {
            const error = new Error(`Match flow tham chiếu key không tồn tại: ${edge.source} -> ${edge.target}`);
            error.statusCode = 400;
            throw error;
        }
        if (edge.source === edge.target) {
            const error = new Error(`Match flow tự tham chiếu tại ${edge.source}`);
            error.statusCode = 400;
            throw error;
        }
    });

    if (!validateNoCycle([...allMatchIds], allEdges)) {
        const error = new Error('Match flow có vòng lặp, không thể lưu');
        error.statusCode = 400;
        throw error;
    }

    const outgoing = new Map();
    const incoming = new Map();
    const targetSlots = new Set();
    allEdges.forEach((edge) => {
        outgoing.set(edge.source, (outgoing.get(edge.source) || 0) + 1);
        incoming.set(edge.target, (incoming.get(edge.target) || 0) + 1);
        if (edge.targetSlot) {
            const slotKey = `${edge.target}:slot-${edge.targetSlot}`;
            if (targetSlots.has(slotKey)) {
                const error = new Error(`Slot ${slotKey} đã có nguồn vào`);
                error.statusCode = 400;
                throw error;
            }
            targetSlots.add(slotKey);
        }
    });
    if ([...outgoing.values()].some((count) => count > 1) || [...incoming.values()].some((count) => count > 2)) {
        const error = new Error('Match flow có quá nhiều liên kết vào/ra một trận');
        error.statusCode = 400;
        throw error;
    }
};

const stableFormatShape = (config = {}) => JSON.stringify({
    stageCount: config.stageCount,
    stages: (Array.isArray(config.stages) ? config.stages : []).map((stage) => ({
        id: stage.id,
        name: stage.name,
        input: stage.input,
        brackets: stage.brackets,
        scoring: stage.scoring,
        rankingCriteria: stage.rankingCriteria,
        luckyCriteria: stage.luckyCriteria,
    })),
});

const buildCompetitionFormatPayload = (body, userId) => {
    const config = body.config && typeof body.config === 'object'
        ? body.config
        : {
            id: body.id,
            tournamentItemId: body.tournamentItemId,
            name: body.name,
            sportType: body.sportType,
            description: body.description,
            status: body.status || 'actived',
            stageCount: body.stageCount,
            stages: Array.isArray(body.stages) ? body.stages : [],
        };
    const selectedType = normalizeSelectedType(body.selectedType || body.sourceKind || config.sourceKind);
    const matchFlow = Array.isArray(config.stages)
        ? config.stages.map((stage) => ({
            id: stage.id,
            order: stage.order,
            name: stage.name,
            wildcard: stage.wildcard || null,
            branches: Array.isArray(stage.brackets) ? stage.brackets.map((branch) => ({
                id: branch.id,
                name: branch.name,
                type: branch.type,
                totalTeamsIn: branch.totalTeamsIn,
                groups: branch.groups || [],
                flowSlots: branch.flowSlots || [],
                flowConnections: branch.flowConnections || [],
                flowConnectionRoutes: branch.flowConnectionRoutes || {},
                flowConnectionsConfigured: branch.flowConnectionsConfigured === true,
                flowDeletedMatchIds: branch.flowDeletedMatchIds || [],
                flowStandaloneMatches: branch.flowStandaloneMatches || [],
                defaultMatches: branch.type === 'knockout'
                    ? Array.from({ length: Math.max(1, Math.ceil(Math.max(2, Number(branch.totalTeamsIn) || 2) / 2)) }, (_, index) => ({
                        id: `${stage.id}:${branch.id}:m-${index + 1}`,
                        code: `M${index + 1}`,
                        slots: [
                            (branch.flowSlots || [])[index * 2] || { id: `${branch.id}-slot-${index * 2 + 1}`, label: `Slot ${index * 2 + 1}` },
                            (branch.flowSlots || [])[index * 2 + 1] || { id: `${branch.id}-slot-${index * 2 + 2}`, label: `Slot ${index * 2 + 2}` },
                        ],
                    })).filter((match) => !(branch.flowDeletedMatchIds || []).includes(match.id))
                    : [],
            })) : [],
        }))
        : [];
    const storedConfig = { ...config, matchFlow };

    return {
        selectedType,
        presetId: ['preset', 'template'].includes(selectedType) ? String(body.presetId || body.templateId || body.categoryTemplateId || body.categoryRuleId || config.id || '') : '',
        presetSource: ['preset', 'template'].includes(selectedType) ? String(body.presetSource || body.sourceKind || 'json') : '',
        name: String(body.name || config.name || ''),
        sportType: String(body.sportType || config.sportType || ''),
        description: String(body.description || config.description || ''),
        stageCount: Number(body.stageCount || config.stageCount || (Array.isArray(config.stages) ? config.stages.length : 0)),
        config: storedConfig,
        updatedBy: userId,
        updatedAt: new Date(),
    };
};

export const getTournamentCompetitionFormat = async (req, res) => {
    try {
        const userId = req.user?._id || req.user?.id;
        const { tournamentItemId } = req.params;
        const { allowed, item, message } = userId
            ? await checkTournamentItemPermission(tournamentItemId, userId)
            : { allowed: false, item: await TournamentItem.findById(tournamentItemId).lean(), message: 'Tournament item not found' };
        if (!item) return res.status(404).json({ success: false, message });
        if (userId && !allowed && !canUseFormatFallback(req)) return res.status(403).json({ success: false, message });

        return res.json({
            success: true,
            data: item.competitionFormat || { selectedType: 'none', config: null },
        });
    } catch (error) {
        console.error('Get tournament competition format failed:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getEligibleTeamsForTournament = async (req, res) => {
    try {
        const userId = req.user?._id || req.user?.id;
        const tournamentItemId = req.params.tournamentItemId || req.params.id;
        const { allowed, item, message } = await checkTournamentItemPermission(tournamentItemId, userId);
        if (!item) return res.status(404).json({ success: false, message });
        if (!allowed && !canUseFormatFallback(req)) return res.status(403).json({ success: false, message });
        const eligible = await getApprovedEligibleTeamsCount(tournamentItemId);
        return res.json({
            success: true,
            data: {
                totalTeams: eligible.totalTeams,
                teamIds: eligible.teamIds,
            },
        });
    } catch (error) {
        console.error('Get eligible teams failed:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const withTournamentItemParam = (req) => {
    if (!req.params.tournamentItemId && req.params.id) req.params.tournamentItemId = req.params.id;
    return req;
};

export const getTournamentCompetitionFormatAlias = async (req, res) => getTournamentCompetitionFormat(withTournamentItemParam(req), res);

export const saveTournamentCompetitionFormatAlias = async (req, res) => saveTournamentCompetitionFormat(withTournamentItemParam(req), res);

export const validateTournamentCompetitionFormat = async (req, res) => {
    try {
        const tournamentItemId = req.params.tournamentItemId || req.params.id;
        const eligibleTeams = await getApprovedEligibleTeamsCount(tournamentItemId);
        let competitionFormat = buildCompetitionFormatPayload({ ...req.body, tournamentItemId }, req.user?._id || req.user?.id);
        competitionFormat = normalizeFormatWithStartTeams(competitionFormat, eligibleTeams);
        validateCompetitionFormatConfig(competitionFormat.config);
        return res.json({
            success: true,
            data: {
                valid: true,
                format: competitionFormat,
                eligibleTeams: {
                    totalTeams: eligibleTeams.totalTeams,
                    teamIds: eligibleTeams.teamIds,
                },
                validationWarnings: [],
            },
        });
    } catch (error) {
        return res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }
};

const templateConfigFromRecord = (template) => {
    const direct = template?.templateConfig?.config || template?.templateConfig || {};
    if (Array.isArray(direct?.stages)) return direct;
    return null;
};

export const applyTournamentTemplateFormat = async (req, res) => {
    try {
        const { templateId } = req.body || {};
        if (!mongoose.Types.ObjectId.isValid(templateId)) {
            return res.status(400).json({ success: false, message: 'Mã thể thức mẫu không hợp lệ' });
        }
        const template = await TournamentTemplate.findOne({
            _id: templateId,
            status: 'actived',
            isActive: { $ne: false },
        }).lean();
        if (!template) return res.status(404).json({ success: false, message: 'Không tìm thấy thể thức mẫu đang hoạt động' });
        const config = req.body?.config && Array.isArray(req.body.config.stages)
            ? req.body.config
            : templateConfigFromRecord(template);
        if (!config || !Array.isArray(config.stages) || !config.stages.length) {
            return res.status(400).json({
                success: false,
                message: 'Thể thức mẫu chưa có cấu hình stage/bracket/match flow đầy đủ để lưu vào giải',
            });
        }
        req.body = {
            ...req.body,
            selectedType: 'template',
            presetId: String(template._id),
            presetSource: 'competition-template',
            name: template.name || template.templateName || config.name,
            sportType: template.sportType || config.sportType,
            description: template.description || config.description,
            config: {
                ...config,
                id: config.id || String(template._id),
                tournamentItemId: req.params.id || req.params.tournamentItemId,
                name: template.name || template.templateName || config.name,
                sportType: template.sportType || config.sportType,
                description: template.description || config.description,
                selectedType: 'template',
                status: config.status || 'actived',
            },
        };
        return saveTournamentCompetitionFormatAlias(req, res);
    } catch (error) {
        console.error('Apply tournament template format failed:', error);
        return res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
};

export const generateTournamentCompetitionFormat = async (req, res) => saveTournamentCompetitionFormatAlias(req, res);

export const saveTournamentCompetitionFormat = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const userId = req.user?._id || req.user?.id;
        const { tournamentItemId } = req.params;
        const { allowed, item, message } = await checkTournamentItemPermission(tournamentItemId, userId);
        if (!item) {
            return res.status(404).json({ success: false, message });
        }
        if (!allowed && !canUseFormatFallback(req)) {
            return res.status(403).json({ success: false, message });
        }

        const eligibleTeams = await getApprovedEligibleTeamsCount(tournamentItemId, session);
        let competitionFormat = buildCompetitionFormatPayload({ ...req.body, tournamentItemId }, userId);
        competitionFormat = normalizeFormatWithStartTeams(competitionFormat, eligibleTeams);
        normalizeFlowConnectionSlots(competitionFormat.config);
        await validateCompetitionTemplateSource(competitionFormat, item);
        validateCompetitionFormatConfig(competitionFormat.config);

        const oldConfig = item.competitionFormat?.config || null;
        const shapeChanged = oldConfig && stableFormatShape(oldConfig) !== stableFormatShape(competitionFormat.config);
        const allowLockedSync = Boolean(req.body?.allowLockedSync || req.body?.confirmSyncPlayed);
        if (shapeChanged) {
            const [lockedMatchCount, resultCount] = await Promise.all([
                Match.countDocuments({
                    tournamentItemId,
                    $or: [
                        { status: { $ne: 'pending' } },
                        { scheduleStatus: 'published' },
                        { scheduledAt: { $ne: null } },
                    ],
                }).session(session),
                MatchResult.countDocuments({ tournamentItemId }).session(session),
            ]);
            if ((lockedMatchCount > 0 || resultCount > 0) && !allowLockedSync) {
                await session.abortTransaction();
                return res.status(409).json({
                    success: false,
                    code: 'FORMAT_SYNC_CONFIRM_REQUIRED',
                    data: {
                        lockedMatchCount,
                        resultCount,
                    },
                    message: 'Thể thức đã phát sinh trận hoặc kết quả. Hãy reset đúng quy trình trước khi ghi đè cấu trúc.',
                });
            }
        }

        const updated = await TournamentItem.findByIdAndUpdate(
            tournamentItemId,
            {
                $set: {
                    competitionFormat,
                    format: competitionFormat.selectedType === 'custom' ? 'custom' : competitionFormat.name,
                },
            },
            { returnDocument: 'after', runValidators: true, session }
        ).lean();

        const syncResult = await syncMatchesFromCompetitionConfig(tournamentItemId, userId, session, {
            force: false,
            allowLocked: allowLockedSync,
        });
        if (!syncResult.ok) {
            return res.status(syncResult.status || 400).json({ success: false, message: syncResult.message });
        }

        await session.commitTransaction();
        return res.json({
            success: true,
            message: 'Competition format saved',
            data: {
                format: updated.competitionFormat,
                eligibleTeams: {
                    totalTeams: eligibleTeams.totalTeams,
                    teamIds: eligibleTeams.teamIds,
                },
                sync: syncResult,
                warnings: syncResult.skipped === 'existingMatches'
                    ? ['Giải cũ đã có trận nên chỉ cập nhật cấu hình, không ghi đè dữ liệu thi đấu hiện có.']
                    : [],
            },
        });
    } catch (error) {
        await session.abortTransaction();
        console.error('Save tournament competition format failed:', error);
        return res.status(error.statusCode || 500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

const participantSkill = (participant) => {
    if (Number.isFinite(Number(participant.skill))) return Number(participant.skill);
    const players = Array.isArray(participant.lineup)
        ? participant.lineup.map((item) => item.Player).filter(Boolean)
        : [];
    const skills = players.map((player) => Number(player.skill || 0)).filter((value) => value > 0);
    if (!skills.length) return 0;
    return skills.reduce((sum, value) => sum + value, 0) / skills.length;
};

const sortParticipantsForCriterion = (participants, criterion, order = 'balanced') => {
    const items = [...participants];
    if (criterion === 'random') {
        return items.sort((a, b) => String(a._id).localeCompare(String(b._id)));
    }
    if (criterion === 'skill' || criterion === 'balanced') {
        const sorted = items.sort((a, b) => participantSkill(b) - participantSkill(a));
        if (order === 'asc') return sorted.reverse();
        return sorted;
    }
    if (criterion === 'seed' || criterion === 'ranking') {
        const sorted = items.sort((a, b) => {
            const seedA = Number(a.seed || a.rank || a.ranking || 999999);
            const seedB = Number(b.seed || b.rank || b.ranking || 999999);
            if (seedA !== seedB) return seedA - seedB;
            return String(a.name || '').localeCompare(String(b.name || ''), 'vi');
        });
        return order === 'desc' ? sorted.reverse() : sorted;
    }
    return items.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'vi'));
};

const balancedOrderForGroups = (teams, groupCount) => {
    const groups = Array.from({ length: Math.max(1, groupCount) }, () => []);
    teams.forEach((team, index) => {
        const round = Math.floor(index / groups.length);
        const offset = index % groups.length;
        const groupIndex = round % 2 === 0 ? offset : groups.length - 1 - offset;
        groups[groupIndex].push(team);
    });
    const output = [];
    const maxRows = Math.max(...groups.map((group) => group.length), 0);
    for (let row = 0; row < maxRows; row += 1) {
        for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
            if (groups[groupIndex][row]) output.push(groups[groupIndex][row]);
        }
    }
    return output;
};

export const previewStageSeeding = async (req, res) => {
    try {
        const userId = req.user?._id || req.user?.id;
        const { tournamentItemId } = req.params;
        const { stage, criterion = 'random', order = 'balanced' } = req.body || {};
        const { allowed, item, message } = await checkTournamentItemPermission(tournamentItemId, userId);
        if (!item) return res.status(404).json({ success: false, message });
        if (!allowed && !canUseFormatFallback(req)) return res.status(403).json({ success: false, message });
        if (!stage || !Array.isArray(stage.brackets)) {
            return res.status(400).json({ success: false, message: 'Thiếu cấu hình stage để xếp đội' });
        }

        const participants = await Participant.find({
            tournamentItemId,
            type: 'team',
            registrationStatus: { $nin: ['rejected', 'suspended'] },
        }).populate('lineup.Player', 'skill name').lean();
        let teams = sortParticipantsForCriterion(participants, criterion, order);
        if (!teams.length) return res.status(400).json({ success: false, message: 'Chưa có đội đủ điều kiện để xếp' });

        const assignments = [];
        let teamIndex = 0;
        for (const branch of stage.brackets) {
            if (branch.type === 'group') {
                const groups = Array.isArray(branch.groups) && branch.groups.length ? branch.groups : [{ name: branch.name, numberOfTeams: branch.totalTeamsIn || teams.length }];
                if (order === 'balanced' || criterion === 'balanced' || criterion === 'skill') {
                    teams = balancedOrderForGroups(teams, groups.length);
                }
                const maxRounds = Math.max(...groups.map((group) => Number(group.numberOfTeams || 0)), 0);
                for (let slotIndex = 0; slotIndex < maxRounds; slotIndex += 1) {
                    for (const [groupIndex, group] of groups.entries()) {
                        if (slotIndex >= Number(group.numberOfTeams || 0) || teamIndex >= teams.length) continue;
                        const team = teams[teamIndex++];
                        const slotId = `${stage.id}:${branch.id}:group-${groupIndex + 1}:slot-${slotIndex + 1}`;
                        assignments.push({
                            slotId,
                            stageId: stage.id,
                            branchId: branch.id,
                            groupName: group.name,
                            slotLabel: `Seed ${slotIndex + 1}`,
                            participantId: String(team._id),
                            participantName: team.name,
                            participantLogo: team.logo || String(team.name || 'Đ').slice(0, 2).toUpperCase(),
                            sourceType: 'PARTICIPANT',
                        });
                    }
                }
            } else {
                const slots = Array.isArray(branch.flowSlots) && branch.flowSlots.length
                    ? branch.flowSlots
                    : Array.from({ length: Math.max(2, Number(branch.totalTeamsIn || teams.length)) }, (_, index) => ({ id: `${branch.id}-slot-${index + 1}`, label: `Seed ${index + 1}` }));
                for (const [slotIndex, slot] of slots.entries()) {
                    if (teamIndex >= teams.length) break;
                    if (String(slot.label || '').toLowerCase().includes('bye')) continue;
                    const team = teams[teamIndex++];
                    const nodeId = `${stage.id}:${branch.id}:m-${Math.floor(slotIndex / 2) + 1}`;
                    assignments.push({
                        slotId: `${nodeId}:seed-${slotIndex}`,
                        stageId: stage.id,
                        branchId: branch.id,
                        nodeId,
                        slotLabel: slot.label || `Seed ${slotIndex + 1}`,
                        participantId: String(team._id),
                        participantName: team.name,
                        participantLogo: team.logo || String(team.name || 'Đ').slice(0, 2).toUpperCase(),
                        sourceType: 'PARTICIPANT',
                    });
                }
            }
        }

        return res.json({
            success: true,
            data: {
                criterion,
                totalTeams: teams.length,
                assignedTeams: assignments.length,
                notes: assignments.length < teams.length ? ['Một số đội chưa được xếp vì số slot không đủ.'] : [],
                assignments,
            },
        });
    } catch (error) {
        console.error('Preview stage seeding failed:', error);
        return res.status(500).json({ success: false, message: error.message || 'Không thể xếp đội tự động' });
    }
};

const sortedTeamsBySkill = (teams) => teams
    .map((team) => {
        const skillScore = participantSkill(team);
        return {
            raw: team,
            teamId: normalizeId(team._id),
            teamName: team.name,
            skillScore,
            seedValue: Number(team.seed || team.rank || team.ranking || 999999),
            registeredAt: team.createdAt ? new Date(team.createdAt).getTime() : 0,
            usedDefaultSkill: skillScore === 0,
        };
    })
    .sort((a, b) => {
        if (b.skillScore !== a.skillScore) return b.skillScore - a.skillScore;
        if (a.seedValue !== b.seedValue) return a.seedValue - b.seedValue;
        if (a.registeredAt !== b.registeredAt) return a.registeredAt - b.registeredAt;
        return String(a.teamName || '').localeCompare(String(b.teamName || ''), 'vi');
    })
    .map((team, index) => ({ ...team, seed: index + 1 }));

const bracketSeedOrder = (teams, strategy) => {
    const sorted = [...teams];
    if (strategy === 'CLOSE_SKILL') return sorted;
    if (strategy === 'STRONG_VS_WEAK') {
        const output = [];
        let left = 0;
        let right = sorted.length - 1;
        while (left < right) {
            output.push(sorted[left], sorted[right]);
            left += 1;
            right -= 1;
        }
        if (left === right) output.push(sorted[left]);
        return output;
    }
    const pairings = [];
    const n = sorted.length;
    for (let index = 0; index < Math.floor(n / 2); index += 1) {
        pairings.push(sorted[index], sorted[n - index - 1]);
    }
    return pairings;
};

const getCompetitionStages = (format = {}) => {
    const config = format?.config && typeof format.config === 'object' ? format.config : {};
    if (Array.isArray(config.stages) && config.stages.length) return config.stages;
    if (Array.isArray(config.config?.stages) && config.config.stages.length) return config.config.stages;
    if (Array.isArray(format?.stages) && format.stages.length) return format.stages;
    return [];
};

const resolvePlacementStage = (stages, stageId) => {
    const requestedId = String(stageId || '').trim();
    return stages.find((item) => item.id === requestedId)
        || stages.find((item) => (item.brackets || []).some((branch) => branch.type === 'group' || branch.type === 'knockout'))
        || stages[0];
};

const buildPlacementPreview = (format, stageId, teams, strategy = 'SNAKE_BALANCE') => {
    const stage = resolvePlacementStage(getCompetitionStages(format), stageId);
    if (!stage) {
        const error = new Error('Không tìm thấy stage để xếp đội');
        error.statusCode = 400;
        throw error;
    }
    const sortedTeams = sortedTeamsBySkill(teams);
    const warnings = sortedTeams.filter((team) => team.usedDefaultSkill).map((team) => `${team.teamName} chưa có dữ liệu skill, dùng điểm mặc định thấp nhất.`);
    const placements = [];
    const groupBranch = (stage.brackets || []).find((branch) => branch.type === 'group');
    if (groupBranch) {
        const groups = Array.isArray(groupBranch.groups) ? groupBranch.groups : [];
        const buckets = groups.map((group) => ({ group, teams: [], totalSkill: 0 }));
        sortedTeams.forEach((team, index) => {
            const bucketIndex = strategy === 'CLOSE_SKILL'
                ? Math.floor(index / Math.max(1, Math.ceil(sortedTeams.length / Math.max(1, buckets.length))))
                : (() => {
                    const round = Math.floor(index / Math.max(1, buckets.length));
                    const offset = index % Math.max(1, buckets.length);
                    return round % 2 === 0 ? offset : buckets.length - 1 - offset;
                })();
            const bucket = buckets[Math.min(bucketIndex, Math.max(0, buckets.length - 1))];
            if (!bucket) return;
            const capacity = Number(bucket.group.numberOfTeams || 0);
            if (bucket.teams.length >= capacity) {
                warnings.push(`${bucket.group.name} đã đủ sức chứa, ${team.teamName} chưa được xếp.`);
                return;
            }
            bucket.teams.push(team);
            bucket.totalSkill += team.skillScore;
            placements.push({
                teamId: team.teamId,
                teamName: team.teamName,
                skillScore: team.skillScore,
                seed: team.seed,
                groupId: bucket.group.id,
                groupName: bucket.group.name,
                matchId: null,
                slotId: `${stage.id}:${groupBranch.id}:group-${bucketIndex + 1}:slot-${bucket.teams.length}`,
            });
        });
    } else {
        const knockoutBranch = (stage.brackets || []).find((branch) => branch.type === 'knockout');
        if (!knockoutBranch) {
            const error = new Error('Stage chưa có bảng hoặc nhánh knockout để xếp đội');
            error.statusCode = 400;
            throw error;
        }
        const slots = Array.isArray(knockoutBranch.flowSlots) && knockoutBranch.flowSlots.length
            ? knockoutBranch.flowSlots
            : Array.from({ length: Number(knockoutBranch.totalTeamsIn || sortedTeams.length) }, (_, index) => ({ id: `${knockoutBranch.id}-slot-${index + 1}` }));
        bracketSeedOrder(sortedTeams, strategy).forEach((team, index) => {
            const slot = slots[index];
            if (!slot) {
                warnings.push(`${team.teamName} chưa có slot knockout phù hợp.`);
                return;
            }
            placements.push({
                teamId: team.teamId,
                teamName: team.teamName,
                skillScore: team.skillScore,
                seed: team.seed,
                groupId: null,
                matchId: `${stage.id}:${knockoutBranch.id}:m-${Math.floor(index / 2) + 1}`,
                slotId: slot.id || `${knockoutBranch.id}-slot-${index + 1}`,
            });
        });
    }
    return {
        stage,
        placements,
        warnings,
        summary: {
            totalTeams: sortedTeams.length,
            placedTeams: placements.length,
            unplacedTeams: Math.max(0, sortedTeams.length - placements.length),
        },
    };
};

export const previewTeamPlacement = async (req, res) => {
    try {
        const userId = req.user?._id || req.user?.id;
        const tournamentItemId = req.params.tournamentItemId || req.params.id;
        const { allowed, item, message } = await checkTournamentItemPermission(tournamentItemId, userId);
        if (!item) return res.status(404).json({ success: false, message });
        if (!allowed && !canUseFormatFallback(req)) return res.status(403).json({ success: false, message });
        const eligible = await getApprovedEligibleTeamsCount(tournamentItemId);
        const savedStages = getCompetitionStages(item.competitionFormat);
        const previewFormat = savedStages.length
            ? item.competitionFormat
            : { config: { stages: req.body?.stageDraft ? [req.body.stageDraft] : [] } };
        const preview = buildPlacementPreview(previewFormat, req.body?.stageId, eligible.teams, req.body?.strategy);
        return res.json({ success: true, data: preview });
    } catch (error) {
        console.error('Preview team placement failed:', error);
        return res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
};

export const confirmTeamPlacement = async (req, res) => {
    try {
        const userId = req.user?._id || req.user?.id;
        const tournamentItemId = req.params.tournamentItemId || req.params.id;
        const { allowed, item, message } = await checkTournamentItemPermission(tournamentItemId, userId);
        if (!item) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message });
        }
        if (!allowed && !canUseFormatFallback(req)) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message });
        }
        const [lockedMatches, resultCount] = await Promise.all([
            Match.countDocuments({
                tournamentItemId,
                $or: [{ scheduleStatus: 'published' }, { status: { $ne: 'pending' } }],
            }),
            MatchResult.countDocuments({ tournamentItemId }),
        ]);
        if (lockedMatches > 0 || resultCount > 0) {
            await session.abortTransaction();
            return res.status(409).json({ success: false, message: 'Giải đã có lịch công bố hoặc kết quả, không thể xếp lại đội trực tiếp.' });
        }
        const dbItem = await TournamentItem.findById(tournamentItemId);
        const eligible = await getApprovedEligibleTeamsCount(tournamentItemId);
        const preview = buildPlacementPreview(dbItem.competitionFormat, req.body?.stageId, eligible.teams, req.body?.strategy);
        const config = dbItem.competitionFormat?.config || {};
        const stages = getCompetitionStages(dbItem.competitionFormat);
        if (!stages.length) {
            const error = new Error('Hãy lưu cấu hình thể thức trước khi áp dụng xếp đội.');
            error.statusCode = 400;
            throw error;
        }
        const stage = stages.find((entry) => entry.id === preview.stage.id);
        if (!stage) throw new Error('Không tìm thấy stage để lưu xếp đội');
        stage.seedAssignments = preview.placements.map((placement) => ({
            slotId: placement.slotId,
            stageId: stage.id,
            groupId: placement.groupId || '',
            groupName: placement.groupName || '',
            nodeId: placement.matchId || '',
            participantId: placement.teamId,
            participantName: placement.teamName,
            sourceType: 'PARTICIPANT',
            seed: placement.seed,
            skillScore: placement.skillScore,
        }));
        stage.placementMethod = 'SKILL';
        stage.placementStrategy = req.body?.strategy || 'SNAKE_BALANCE';
        stage.placedAt = new Date();
        stage.placedBy = userId;
        dbItem.markModified('competitionFormat');
        await dbItem.save();
        return res.json({ success: true, data: preview });
    } catch (error) {
        console.error('Confirm team placement failed:', error);
        return res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
};

const normalizeWildcardCriterion = (value) => {
    const text = String(value?.type || value || '').trim();
    const map = {
        POINTS: 'points',
        POINT_DIFFERENCE: 'pointDiff',
        POINTS_PER_MATCH: 'pointsPerMatch',
        POINT_DIFFERENCE_PER_MATCH: 'pointDiffPerMatch',
        WINS: 'wins',
        WIN_RATE: 'winRate',
        POINTS_FOR: 'pointsFor',
        POINTS_AGAINST: 'pointsAgainst',
        HEAD_TO_HEAD: 'headToHead',
        SKILL: 'skill',
        SEED: 'seed',
        DRAW: 'draw',
        goalsFor: 'pointsFor',
        goalsAgainst: 'pointsAgainst',
        goalDifference: 'pointDiff',
    };
    return map[text] || text;
};

const criteriaForWildcardStage = (stage) => {
    const structured = Array.isArray(stage?.wildcard?.criteria) ? stage.wildcard.criteria : [];
    const source = structured.length
        ? structured
        : (Array.isArray(stage?.luckyCriteria) ? stage.luckyCriteria : ['points', 'pointDiff', 'draw']);
    return source
        .map((criterion, index) => ({
            type: normalizeWildcardCriterion(criterion),
            priority: Number(criterion?.priority || index + 1),
        }))
        .filter((criterion) => criterion.type)
        .sort((a, b) => a.priority - b.priority);
};

const drawSeedForTeam = (teamId, targetStageId, persisted = {}) => {
    const existing = Number(persisted?.[teamId]);
    if (Number.isFinite(existing) && existing > 0) return existing;
    const key = `${targetStageId}:${teamId}`;
    let hash = 0;
    for (let index = 0; index < key.length; index += 1) hash = ((hash << 5) - hash) + key.charCodeAt(index);
    return Math.abs(hash) + 1;
};

const emptyWildcardStats = (teamId) => ({
    teamId,
    teamName: '',
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    pointDiff: 0,
    points: 0,
    pointsPerMatch: 0,
    pointDiffPerMatch: 0,
    winRate: 0,
    skill: 0,
    seed: 999999,
    stageIds: [],
    stageNames: [],
    reasons: [],
});

const compareHeadToHead = async (left, right, sourceStageRules, session = null) => {
    const stageIds = sourceStageRules.map((stageRule) => stageRule._id);
    const query = Match.find({
        stageId: { $in: stageIds },
        participants: { $all: [left.teamId, right.teamId] },
        status: 'completed',
    }).select('_id winnerParticipantId participants').lean();
    if (session) query.session(session);
    const matches = await query;
    if (!matches.length) return 0;
    let leftWins = 0;
    let rightWins = 0;
    matches.forEach((match) => {
        const winnerId = normalizeId(match.winnerParticipantId);
        if (winnerId === left.teamId) leftWins += 1;
        if (winnerId === right.teamId) rightWins += 1;
    });
    if (leftWins !== rightWins) return rightWins - leftWins;
    return 0;
};

const buildWildcardContext = async (tournamentItemId, targetStageId, userId, session = null) => {
    const perm = await checkTournamentItemPermission(tournamentItemId, userId);
    if (!perm.item) {
        const error = new Error(perm.message || 'Không tìm thấy giải đấu');
        error.statusCode = 404;
        throw error;
    }
    if (!perm.allowed && !canUseFormatFallback({ userRoles: [] })) {
        const error = new Error(perm.message || 'Không có quyền thao tác giải đấu');
        error.statusCode = 403;
        throw error;
    }
    const item = session
        ? await TournamentItem.findById(tournamentItemId).session(session)
        : perm.item;
    const config = item?.competitionFormat?.config || {};
    const stages = Array.isArray(config.stages) ? config.stages : [];
    const targetStage = stages.find((stage) => stage.id === targetStageId)
        || stages.find((stage) => stage.wildcard?.enabled)
        || stages[0];
    if (!targetStage) {
        const error = new Error('Không tìm thấy stage nhận vé vớt');
        error.statusCode = 400;
        throw error;
    }
    const sourceStages = stages
        .filter((stage) => Number(stage.order || 0) < Number(targetStage.order || 0))
        .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
    const sourceOrders = sourceStages.map((stage) => Number(stage.order)).filter(Boolean);
    const sourceStageRules = sourceOrders.length
        ? await StageRule.find({ tournamentItemId, number: { $in: sourceOrders } }).sort({ number: 1 }).session(session).lean()
        : [];
    const targetStageRule = await StageRule.findOne({ tournamentItemId, number: Number(targetStage.order || 0) }).session(session).lean();
    return { item, config, stages, targetStage, sourceStages, sourceStageRules, targetStageRule };
};

const officialTeamIdsForStage = async (tournamentItemId, targetStage, targetStageRule, session = null) => {
    const ids = new Set();
    (Array.isArray(targetStage.seedAssignments) ? targetStage.seedAssignments : []).forEach((assignment) => {
        if (assignment.participantId) ids.add(String(assignment.participantId));
    });
    if (targetStageRule?._id) {
        const query = Match.find({ tournamentItemId, stageId: targetStageRule._id }).select('participants').lean();
        if (session) query.session(session);
        const matches = await query;
        matches.forEach((match) => (match.participants || []).forEach((participantId) => ids.add(normalizeId(participantId))));
    }
    return ids;
};

const sourceStagesReady = async (tournamentItemId, sourceStageRules, session = null) => {
    if (!sourceStageRules.length) return { ready: false, pending: ['Chưa có stage nguồn để tính vé vớt.'] };
    const stageIds = sourceStageRules.map((stageRule) => stageRule._id);
    const matchQuery = Match.find({ tournamentItemId, stageId: { $in: stageIds } }).select('_id status').lean();
    if (session) matchQuery.session(session);
    const matches = await matchQuery;
    if (!matches.length) return { ready: false, pending: ['Stage nguồn chưa có trận đấu.'] };
    const completedIds = matches.filter((match) => match.status === 'completed').map((match) => match._id);
    const resultQuery = MatchResult.countDocuments({ matchId: { $in: completedIds }, status: 'confirmed' });
    if (session) resultQuery.session(session);
    const confirmedCount = await resultQuery;
    const pending = [];
    if (completedIds.length !== matches.length) pending.push('Còn trận trong stage nguồn chưa hoàn thành.');
    if (confirmedCount !== completedIds.length) pending.push('Còn kết quả chưa được xác nhận.');
    return { ready: pending.length === 0, pending };
};

const aggregateWildcardCandidates = async ({ tournamentItemId, targetStage, sourceStages, sourceStageRules, targetStageRule, config }, session = null) => {
    const officialIds = await officialTeamIdsForStage(tournamentItemId, targetStage, targetStageRule, session);
    const stageRuleById = new Map(sourceStageRules.map((stageRule) => [normalizeId(stageRule._id), stageRule]));
    const sourceStageRuleIds = sourceStageRules.map((stageRule) => stageRule._id);
    const standingQuery = Standing.find({
        tournamentItemId,
        stageId: { $in: sourceStageRuleIds },
    }).lean();
    if (session) standingQuery.session(session);
    const standings = await standingQuery;
    const standingParticipantIds = [...new Set(standings.map((standing) => normalizeId(standing.teamOrPlayerId)).filter(Boolean))];
    const participantQuery = Participant.find({ _id: { $in: standingParticipantIds } })
        .select('name logo skill seed rank ranking lineup')
        .lean();
    if (session) participantQuery.session(session);
    const standingParticipants = standingParticipantIds.length ? await participantQuery : [];
    const participantById = new Map(standingParticipants.map((participant) => [normalizeId(participant._id), participant]));
    const rows = new Map();
    standings.forEach((standing) => {
        const teamId = normalizeId(standing.teamOrPlayerId);
        if (!teamId || officialIds.has(teamId)) return;
        const played = Number(standing.played || 0);
        if (played <= 0) return;
        const row = rows.get(teamId) || emptyWildcardStats(teamId);
        const participant = participantById.get(teamId) || {};
        row.teamName = row.teamName || participant.name || 'Đội thi đấu';
        row.played += played;
        row.wins += Number(standing.wins || 0);
        row.draws += Number(standing.draws || 0);
        row.losses += Number(standing.losses || 0);
        row.pointsFor += Number(standing.goalsFor || standing.pointsFor || 0);
        row.pointsAgainst += Number(standing.goalsAgainst || standing.pointsAgainst || 0);
        row.pointDiff += Number(standing.goalDifference || 0);
        row.points += Number(standing.points || 0);
        row.skill = Math.max(row.skill, participantSkill(participant));
        row.seed = Math.min(row.seed, Number(participant.seed || participant.rank || participant.ranking || 999999));
        const stageRule = stageRuleById.get(normalizeId(standing.stageId));
        if (stageRule && !row.stageIds.includes(normalizeId(stageRule._id))) {
            row.stageIds.push(normalizeId(stageRule._id));
            row.stageNames.push(stageRule.name || `Stage ${stageRule.number}`);
        }
        rows.set(teamId, row);
    });
    const drawStore = config?.wildcardDraws?.[targetStage.id] || {};
    const criteria = criteriaForWildcardStage(targetStage);
    const candidates = [...rows.values()].map((row) => ({
        ...row,
        pointsPerMatch: row.played ? row.points / row.played : 0,
        pointDiffPerMatch: row.played ? row.pointDiff / row.played : 0,
        winRate: row.played ? row.wins / row.played : 0,
        drawRank: drawSeedForTeam(row.teamId, targetStage.id, drawStore),
    }));
    for (const criterion of criteria) {
        if (criterion.type === 'headToHead') continue;
        candidates.forEach((candidate) => {
            if (criterion.type === 'draw') candidate.reasons.push(`Bốc thăm: ${candidate.drawRank}`);
        });
    }
    candidates.sort((a, b) => {
        for (const criterion of criteria) {
            const type = criterion.type;
            if (type === 'pointsAgainst' || type === 'seed' || type === 'draw') {
                const left = type === 'draw' ? a.drawRank : Number(a[type] || 999999);
                const right = type === 'draw' ? b.drawRank : Number(b[type] || 999999);
                if (left !== right) return left - right;
            } else if (type !== 'headToHead') {
                const left = Number(a[type] || 0);
                const right = Number(b[type] || 0);
                if (left !== right) return right - left;
            }
        }
        return String(a.teamName || '').localeCompare(String(b.teamName || ''), 'vi');
    });
    const headToHeadIndex = criteria.findIndex((criterion) => criterion.type === 'headToHead');
    if (headToHeadIndex >= 0) {
        for (let index = 0; index < candidates.length - 1; index += 1) {
            const current = candidates[index];
            const next = candidates[index + 1];
            const tiedBeforeHeadToHead = criteria.slice(0, headToHeadIndex).every((criterion) => {
                const type = criterion.type;
                return Number(current[type] || 0) === Number(next[type] || 0);
            });
            if (!tiedBeforeHeadToHead) continue;
            const compare = await compareHeadToHead(current, next, sourceStageRules, session);
            if (compare > 0) {
                candidates[index] = next;
                candidates[index + 1] = current;
            }
        }
    }
    return { candidates, officialTeamIds: [...officialIds], sourceStages, criteria };
};

const wildcardPreviewPayload = async (tournamentItemId, targetStageId, userId, session = null) => {
    const context = await buildWildcardContext(tournamentItemId, targetStageId, userId, session);
    const readiness = await sourceStagesReady(tournamentItemId, context.sourceStageRules, session);
    const aggregate = await aggregateWildcardCandidates(context, session);
    const slots = Number(context.targetStage?.wildcard?.slots || context.targetStage?.wildcard?.selection?.slots || 0);
    const selected = aggregate.candidates.slice(0, Math.max(0, slots)).map((candidate, index) => ({
        key: `Lucky${index + 1}`,
        ...candidate,
        rank: index + 1,
    }));
    return {
        targetStageId: context.targetStage.id,
        targetStageName: context.targetStage.name,
        sourceStageIds: context.sourceStages.map((stage) => stage.id),
        sourceStageNames: context.sourceStages.map((stage) => stage.name),
        readyToResolve: readiness.ready,
        pendingReasons: readiness.pending,
        criteria: aggregate.criteria,
        officialTeamIds: aggregate.officialTeamIds,
        candidates: aggregate.candidates.map((candidate, index) => ({ ...candidate, rank: index + 1 })),
        selected,
        summary: {
            slots,
            totalCandidates: aggregate.candidates.length,
            selectedTeams: selected.length,
        },
    };
};

export const getWildcardCandidates = async (req, res) => {
    try {
        const userId = req.user?._id || req.user?.id;
        const tournamentItemId = req.params.tournamentItemId || req.params.id;
        const data = await wildcardPreviewPayload(tournamentItemId, req.query.stageId || req.body?.stageId, userId);
        return res.json({ success: true, data });
    } catch (error) {
        console.error('Get wildcard candidates failed:', error);
        return res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
};

export const previewWildcard = async (req, res) => {
    try {
        const userId = req.user?._id || req.user?.id;
        const tournamentItemId = req.params.tournamentItemId || req.params.id;
        const data = await wildcardPreviewPayload(tournamentItemId, req.body?.stageId, userId);
        return res.json({ success: true, data });
    } catch (error) {
        console.error('Preview wildcard failed:', error);
        return res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
};

export const confirmWildcard = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const userId = req.user?._id || req.user?.id;
        const tournamentItemId = req.params.tournamentItemId || req.params.id;
        const preview = await wildcardPreviewPayload(tournamentItemId, req.body?.stageId, userId, session);
        if (!preview.readyToResolve) {
            await session.abortTransaction();
            return res.status(409).json({ success: false, message: 'Chưa đủ điều kiện resolve vé vớt.', data: preview });
        }
        const context = await buildWildcardContext(tournamentItemId, preview.targetStageId, userId, session);
        if (context.targetStageRule?._id) {
            const locked = await Match.countDocuments({
                tournamentItemId,
                stageId: context.targetStageRule._id,
                $or: [{ scheduleStatus: 'published' }, { status: { $ne: 'pending' } }],
            }).session(session);
            if (locked > 0) {
                await session.abortTransaction();
                return res.status(409).json({ success: false, message: 'Stage đích đã công bố lịch hoặc đã thi đấu. Hãy xử lý vé vớt thủ công.' });
            }
        }
        const item = await TournamentItem.findById(tournamentItemId).session(session);
        const config = item.competitionFormat?.config || {};
        const targetStage = (config.stages || []).find((stage) => stage.id === preview.targetStageId);
        if (!targetStage) throw new Error('Không tìm thấy stage đích khi lưu vé vớt');
        const drawRanks = Object.fromEntries(preview.candidates.map((candidate) => [candidate.teamId, candidate.drawRank]));
        config.wildcardDraws = {
            ...(config.wildcardDraws || {}),
            [targetStage.id]: {
                ...drawRanks,
                performedAt: new Date(),
                performedBy: userId,
            },
        };
        config.wildcardResults = {
            ...(config.wildcardResults || {}),
            [targetStage.id]: {
                targetStageId: targetStage.id,
                sourceStageIds: preview.sourceStageIds,
                criteria: preview.criteria,
                selected: preview.selected.map((item) => ({
                    key: item.key,
                    participantId: item.teamId,
                    participantName: item.teamName,
                    rank: item.rank,
                })),
                confirmedAt: new Date(),
                confirmedBy: userId,
            },
        };
        targetStage.wildcard = {
            ...(targetStage.wildcard || {}),
            enabled: true,
            slots: preview.summary.slots,
            sourceStageIds: preview.sourceStageIds,
            criteria: preview.criteria,
            resolvedSlots: preview.selected.map((item) => ({
                key: item.key,
                participantId: item.teamId,
                resolutionStatus: 'RESOLVED',
            })),
        };
        item.markModified('competitionFormat');
        await item.save({ session });
        await session.commitTransaction();
        return res.json({ success: true, data: preview });
    } catch (error) {
        await session.abortTransaction();
        console.error('Confirm wildcard failed:', error);
        return res.status(error.statusCode || 500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

export const createStage = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const userId = req.user._id;
        const { tournamentItemId, stageData, brackets } = req.body;

        const { isAdmin, isOwner, item } = await checkTournamentItemPermission(tournamentItemId, userId);
        if (!isAdmin && !isOwner) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: 'Permission denied' });
        }

        // Kiểm tra số stage không trùng
        const existingStages = await StageRule.find({ tournamentItemId }).sort({ number: 1 }).session(session);
        if (existingStages.some(s => s.number === stageData.number)) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: `Stage number ${stageData.number} already exists` });
        }

        const categoryRule = await CategoryRule.findById(item.categoryRule).session(session);
        if (!categoryRule) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'CategoryRule not found' });
        }
        const sportType = categoryRule.sportType;

        const stage = await createStageWithBrackets({ tournamentItemId, stageData, brackets, session });

        // Cập nhật sport cho các group
        if (brackets && brackets.some(b => b.type === 'group')) {
            const bracketsOfStage = await Bracket.find({ stageId: stage._id }).session(session);
            const bracketIds = bracketsOfStage.map(b => b._id);
            await Group.updateMany({ bracketId: { $in: bracketIds } }, { sport: sportType }, { session });
        }

        await TournamentItem.findByIdAndUpdate(
            tournamentItemId,
            { $addToSet: { 'structure.stage': stage._id } },
            { session }
        );

        await session.commitTransaction();
        return res.status(201).json({ success: true, message: 'Stage created', data: stage });
    } catch (error) {
        await session.abortTransaction();
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

export const getStagesByTournamentItem = async (req, res) => {
    try {
        const { tournamentItemId } = req.params;
        const stages = await StageRule.find({ tournamentItemId }).sort({ number: 1 }).lean();
        return res.json({ success: true, data: stages });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getStageById = async (req, res) => {
    try {
        const stage = await StageRule.findById(req.params.id).lean();
        if (!stage) return res.status(404).json({ success: false, message: 'Stage not found' });
        const brackets = await Bracket.find({ stageId: stage._id })
            .populate({ path: 'group', populate: { path: 'matches' } })
            .lean();
        return res.json({ success: true, data: { ...stage, brackets } });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateStage = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const userId = req.user._id;
        const { id } = req.params;
        const updateData = req.body;

        const stage = await StageRule.findById(id).session(session);
        if (!stage) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Stage not found' });
        }

        const { isAdmin, isOwner } = await checkTournamentItemPermission(stage.tournamentItemId, userId);
        if (!isAdmin && !isOwner) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: 'Permission denied' });
        }

        const allowed = ['name', 'startDate', 'endDate', 'pointsConfig', 'rankingCriteria', 'totalTeamsIn', 'hasWildcards', 'wildcardsCount', 'status'];
        const filtered = {};
        allowed.forEach(f => { if (updateData[f] !== undefined) filtered[f] = updateData[f]; });
        Object.assign(stage, filtered);
        await stage.save({ session });

        await session.commitTransaction();
        return res.json({ success: true, data: stage });
    } catch (error) {
        await session.abortTransaction();
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

export const publishStageStandings = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const userId = req.user._id;
        const { id } = req.params;
        const stage = await StageRule.findById(id).session(session);
        if (!stage) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Stage not found' });
        }

        const { isAdmin, isOwner } = await checkTournamentItemPermission(stage.tournamentItemId, userId);
        if (!isAdmin && !isOwner) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: 'Permission denied' });
        }

        stage.standingsStatus = 'published';
        stage.standingsPublishedAt = new Date();
        stage.standingsPublishedBy = userId;
        await stage.save({ session });

        await session.commitTransaction();
        return res.json({ success: true, data: stage, message: 'Standings published' });
    } catch (error) {
        await session.abortTransaction();
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

export const deleteStage = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const userId = req.user._id;
        const { id } = req.params;
        const stage = await StageRule.findById(id).session(session);
        if (!stage) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Stage not found' });
        }

        const { isAdmin, isOwner, item } = await checkTournamentItemPermission(stage.tournamentItemId, userId);
        if (!isAdmin && !isOwner) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: 'Permission denied' });
        }

        // Xóa bracket, group, match
        const brackets = await Bracket.find({ stageId: stage._id }).session(session);
        for (const bracket of brackets) {
            const groups = await Group.find({ bracketId: bracket._id }).session(session);
            for (const group of groups) {
                await Match.deleteMany({ groupId: group._id }).session(session);
                await group.deleteOne({ session });
            }
            await Match.deleteMany({ bracketId: bracket._id }).session(session);
            await bracket.deleteOne({ session });
        }
        await stage.deleteOne({ session });

        await TournamentItem.findByIdAndUpdate(
            stage.tournamentItemId,
            { $pull: { 'structure.stage': stage._id } },
            { session }
        );

        // Giải phóng categoryRule nếu không còn stage nào
        const remainingStages = await StageRule.countDocuments({ tournamentItemId: stage.tournamentItemId }).session(session);
        if (remainingStages === 0) {
            await CategoryRule.findByIdAndUpdate(
                item.categoryRule,
                { tournamentItemId: null },
                { session }
            );
        }

        await session.commitTransaction();
        return res.json({ success: true, message: 'Stage deleted' });
    } catch (error) {
        await session.abortTransaction();
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

export const completeStage = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const userId = req.user._id;
        const { id } = req.params;

        const currentStage = await StageRule.findById(id).session(session);
        if (!currentStage) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Stage not found' });
        }

        const { isAdmin, isOwner } = await checkTournamentItemPermission(currentStage.tournamentItemId, userId);
        if (!isAdmin && !isOwner) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: 'Permission denied' });
        }

        if (currentStage.status !== 'active') {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Stage is not active' });
        }

        currentStage.status = 'completed';
        currentStage.endDate = new Date();
        await currentStage.save({ session });

        const nextStage = await StageRule.findOne({
            tournamentItemId: currentStage.tournamentItemId,
            number: { $gt: currentStage.number },
            status: 'pending'
        }).sort({ number: 1 }).session(session);

        if (nextStage) {
            nextStage.status = 'active';
            nextStage.startDate = new Date();
            await nextStage.save({ session });
        }

        await session.commitTransaction();
        return res.json({
            success: true,
            message: 'Stage completed, next stage activated if exists',
            data: { currentStage, nextStage }
        });
    } catch (error) {
        await session.abortTransaction();
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};
