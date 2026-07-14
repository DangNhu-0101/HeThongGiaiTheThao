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
import { checkTournamentItemPermission } from '../utils/tournamentHelper.js';

const normalizeSelectedType = (value) => {
    if (value === 'preset' || value === 'custom') return value;
    return 'custom';
};

const canUseFormatFallback = (req) => {
    const roles = Array.isArray(req.userRoles) ? req.userRoles : [];
    return roles.some((role) => ['admin', 'org', 'organization'].includes(role));
};

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
        presetId: selectedType === 'preset' ? String(body.presetId || body.categoryTemplateId || body.categoryRuleId || config.id || '') : '',
        presetSource: selectedType === 'preset' ? String(body.presetSource || body.sourceKind || 'json') : '',
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

export const saveTournamentCompetitionFormat = async (req, res) => {
    try {
        const userId = req.user?._id || req.user?.id;
        const { tournamentItemId } = req.params;
        const { allowed, item, message } = await checkTournamentItemPermission(tournamentItemId, userId);
        if (!item) return res.status(404).json({ success: false, message });
        if (!allowed && !canUseFormatFallback(req)) return res.status(403).json({ success: false, message });

        const competitionFormat = buildCompetitionFormatPayload({ ...req.body, tournamentItemId }, userId);
        const updated = await TournamentItem.findByIdAndUpdate(
            tournamentItemId,
            {
                $set: {
                    competitionFormat,
                    format: competitionFormat.selectedType === 'custom' ? 'custom' : competitionFormat.name,
                },
            },
            { new: true, runValidators: true }
        ).lean();

        return res.json({
            success: true,
            message: 'Competition format saved',
            data: updated.competitionFormat,
        });
    } catch (error) {
        console.error('Save tournament competition format failed:', error);
        return res.status(500).json({ success: false, message: error.message });
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
