// controllers/stageController.js
import mongoose from 'mongoose';
import { createStageWithBrackets } from '../services/stageCreationService.js';
import TournamentItem from '../models/tournamentItem.js';
import CategoryRule from '../models/rules/categories.js';
import User from '../models/users.js';
import Organization from '../models/orgs.js';
import StageRule from '../models/rules/stageRules.js';
import Bracket from '../models/rules/brackets.js';
import Group from '../models/groups.js';
import Match from '../models/matches.js';

// Tạo stage mới (có thể tạo một stage riêng lẻ)
export const createStage = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const userId = req.user._id;
        const { tournamentItemId, stageData, brackets } = req.body;

        const tournamentItem = await TournamentItem.findById(tournamentItemId).session(session);
        if (!tournamentItem) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'TournamentItem not found' });
        }

        const user = await User.findById(userId).populate('roles').session(session);
        const hasAdmin = user.roles.some(r => r.name === 'admin');
        const isOwner = await Organization.findOne({ _id: tournamentItem.organization, ownerId: userId }).session(session);
        if (!hasAdmin && !isOwner) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: 'Permission denied' });
        }

        const categoryRule = await CategoryRule.findById(tournamentItem.categoryRule).session(session);
        if (!categoryRule) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'CategoryRule not found' });
        }
        const sportType = categoryRule.sportType;

        // Tạo stage
        const stage = await createStageWithBrackets({ tournamentItemId, stageData, brackets, session });

        // Cập nhật sport cho các group (nếu có)
        if (brackets && brackets.some(b => b.type === 'group')) {
            const bracketsOfStage = await Bracket.find({ stageId: stage._id }).session(session);
            const bracketIds = bracketsOfStage.map(b => b._id);
            await Group.updateMany({ bracketId: { $in: bracketIds } }, { sport: sportType }, { session });
        }

        // Sau khi tạo stage, cập nhật lại mảng stages trong TournamentItem (nếu cần)
        await TournamentItem.findByIdAndUpdate(tournamentItemId, { $addToSet: { 'structure.stage': stage._id } }, { session });

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

// Lấy danh sách stages của tournament item (sắp xếp theo number)
export const getStagesByTournamentItem = async (req, res) => {
    try {
        const { tournamentItemId } = req.params;
        const stages = await StageRule.find({ tournamentItemId }).sort({ number: 1 }).lean();
        return res.json({ success: true, data: stages });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy stage theo id kèm brackets, groups, matches
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

// Cập nhật stage (chỉ một số trường)
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

        const tournamentItem = await TournamentItem.findById(stage.tournamentItemId).session(session);
        const user = await User.findById(userId).populate('roles').session(session);
        const hasAdmin = user.roles.some(r => r.name === 'admin');
        const isOwner = await Organization.findOne({ _id: tournamentItem.organization, ownerId: userId }).session(session);
        if (!hasAdmin && !isOwner) {
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

// Xóa stage (cascade xóa brackets, groups, matches)
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
        const tournamentItem = await TournamentItem.findById(stage.tournamentItemId).session(session);
        const user = await User.findById(userId).populate('roles').session(session);
        const hasAdmin = user.roles.some(r => r.name === 'admin');
        const isOwner = await Organization.findOne({ _id: tournamentItem.organization, ownerId: userId }).session(session);
        if (!hasAdmin && !isOwner) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: 'Permission denied' });
        }

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
        await TournamentItem.findByIdAndUpdate(stage.tournamentItemId, { $pull: { 'structure.stage': stage._id } }, { session });

        await session.commitTransaction();
        return res.json({ success: true, message: 'Stage deleted' });
    } catch (error) {
        await session.abortTransaction();
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// Kích hoạt stage tiếp theo khi stage hiện tại hoàn thành
export const completeStage = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const userId = req.user._id;
        const { id } = req.params; // stageId cần hoàn thành

        const currentStage = await StageRule.findById(id).session(session);
        if (!currentStage) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Stage not found' });
        }

        const tournamentItem = await TournamentItem.findById(currentStage.tournamentItemId).session(session);
        const user = await User.findById(userId).populate('roles').session(session);
        const hasAdmin = user.roles.some(r => r.name === 'admin');
        const isOwner = await Organization.findOne({ _id: tournamentItem.organization, ownerId: userId }).session(session);
        if (!hasAdmin && !isOwner) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: 'Permission denied' });
        }

        // Kiểm tra nếu stage đã hoàn thành hoặc chưa active
        if (currentStage.status !== 'active') {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Stage is not active' });
        }

        // Cập nhật current stage thành completed
        currentStage.status = 'completed';
        currentStage.endDate = new Date();
        await currentStage.save({ session });

        // Tìm stage tiếp theo (cùng tournamentItemId, number > currentStage.number)
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
        return res.json({ success: true, message: 'Stage completed, next stage activated if exists', data: { currentStage, nextStage } });
    } catch (error) {
        await session.abortTransaction();
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};