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