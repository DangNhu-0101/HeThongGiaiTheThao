// controllers/tournamentController.js
import mongoose from 'mongoose';
import Tournament from '../models/tournaments.js';
import TournamentItem from '../models/tournamentItem.js';
import CategoryRule from '../models/rules/categories.js';
import User from '../models/users.js';

// ========== GET ==========
export const getAllTournaments = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, organizerId, sortBy = 'createdAt', order = 'desc' } = req.query;
        const filter = {};
        if (status) filter.status = { $in: status.split(',') };
        if (organizerId) filter.organization = { $in: organizerId.split(',') };
        const tournaments = await Tournament.find(filter)
            .populate('organization', 'name logo email')
            .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));
        const total = await Tournament.countDocuments(filter);
        res.json({ data: tournaments, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllSingleSportTournaments = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, sportType, organizerId, sortBy = 'createdAt', order = 'desc' } = req.query;
        const filter = {};
        if (status) filter.status = { $in: status.split(',') };
        if (sportType) filter.sportType = sportType;
        if (organizerId) filter.organization = { $in: organizerId.split(',') };

        // Chỉ lấy các giải đơn môn (tournamentId = null)
        filter.tournamentId = null;

        const sort = { [sortBy]: order === 'desc' ? -1 : 1 };
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = parseInt(limit);

        const tournaments = await TournamentItem.find(filter)
            .populate('organization', 'name logo email')
            .populate({
                path: 'categoryRule',
                populate: ['gameRule', 'scoringRule', 'timeManagementRule', 'resourceManagementRule', 'faultsAndPenaltiesRule']
            })
            .sort(sort)
            .skip(skip)
            .limit(limitNum);

        const total = await TournamentItem.countDocuments(filter);

        res.json({
            data: tournaments,
            pagination: {
                page: parseInt(page),
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Lấy danh sách giải đơn môn của tổ chức/user hiện tại
export const getSingleSportTournamentsByOrganization = async (req, res) => {
    try {
        const currentUser = req.user._id;
        const user = await User.findById(currentUser).populate('roles');
        if (!user) return res.status(404).json({ message: "Người dùng không tồn tại" });
        const hasAdmin = user.roles.some(r => r.name === 'admin');

        let filter = { tournamentId: null }; // chỉ lấy giải đơn môn
        if (!hasAdmin) {
            filter.organization = currentUser;
        } else if (req.query.organizationId) {
            filter.organization = req.query.organizationId;
        }

        const { status, sportType } = req.query;
        if (status) filter.status = status;
        if (sportType) filter.sportType = sportType;

        const tournaments = await TournamentItem.find(filter)
            .populate('organization', 'name logo email')
            .populate({
                path: 'categoryRule',
                populate: ['gameRule', 'scoringRule', 'timeManagementRule', 'resourceManagementRule', 'faultsAndPenaltiesRule']
            })
            .sort({ createdAt: -1 });

        res.json({ data: tournaments });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getTournamentByOrganization = async (req, res) => {
    try {
        const currentUser = req.user._id;
        const user = await User.findById(currentUser).populate('roles');
        if (!user) return res.status(404).json({ message: "Người dùng không tồn tại" });
        const hasAdmin = user.roles.some(r => r.name === 'admin');
        let filter = {};
        if (!hasAdmin) {
            filter = { organization: currentUser };
        } else if (req.query.organizationId) {
            filter = { organization: req.query.organizationId };
        }
        const { status } = req.query;
        if (status) filter.status = status;
        const tournaments = await Tournament.find(filter)
            .populate('organization', 'name logo email')
            .sort({ createdAt: -1 });
        res.json({ data: tournaments });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getTournamentById = async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id)
            .populate('organization', 'name logo email')
            .populate({
                path: 'tournamnetItem',
                populate: {
                    path: 'categoryRule',
                    populate: ['gameRule', 'scoringRule', 'timeManagementRule', 'resourceManagementRule', 'faultsAndPenaltiesRule']
                }
            });
        if (!tournament) return res.status(404).json({ message: "Không tìm thấy hội thao" });
        if (tournament.status === 'cancelled') {
            const user = await User.findById(req.user._id).populate('roles');
            const hasAdmin = user?.roles.some(r => r.name === 'admin');
            const isOwner = tournament.organization && tournament.organization.toString() === req.user._id.toString();
            if (!hasAdmin && !isOwner) return res.status(403).json({ message: "Bạn không có quyền xem hội thao đã bị hủy" });
        }
        res.json(tournament);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getSingleTournamentById = async (req, res) => {
    try {
        const item = await TournamentItem.findById(req.params.id)
            .populate('organization', 'name logo email')
            .populate({
                path: 'categoryRule',
                populate: ['gameRule', 'scoringRule', 'timeManagementRule', 'resourceManagementRule', 'faultsAndPenaltiesRule']
            });
        if (!item) return res.status(404).json({ message: "Không tìm thấy giải đấu" });
        if (item.status === 'cancelled') {
            const user = await User.findById(req.user._id).populate('roles');
            const hasAdmin = user?.roles.some(r => r.name === 'admin');
            const isOwner = item.organization && item.organization.toString() === req.user._id.toString();
            if (!hasAdmin && !isOwner) return res.status(403).json({ message: "Bạn không có quyền xem giải đấu đã bị hủy" });
        }
        // Trả về đầy đủ các trường
        const result = {
            ...item.toObject(),
            sportType: item.sportType || item.categoryRule?.sportType || '',
            description: item.description || '',
            registeredTeams: item.registeredTeams || 0,
            maxTeams: item.maxTeams || 0,
            prizes: item.prizes || '',
            format: item.format || '',
            location: item.location || { city: '', district: '', detail: '' }
        };
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ========== CREATE ==========
export const createSingleSportTournament = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const userId = req.user._id;
        const {
            name, description, categoryRuleId,
            registrationStart, registrationEnd, tournamentStart, tournamentEnd,
            location, banner, logo, prizes, galaConfig, paymentQR,
            sportType, maxTeams, format
        } = req.body;

        if (!categoryRuleId) throw new Error("Thiếu categoryRuleId");

        const user = await User.findById(userId).populate('roles');
        const hasOrg = user.roles.some(r => r.name === 'org');
        const hasAdmin = user.roles.some(r => r.name === 'admin');
        if (!hasOrg && !hasAdmin) throw new Error("Bạn không có quyền tạo giải đấu");

        const categoryRule = await CategoryRule.findById(categoryRuleId).session(session);
        if (!categoryRule) throw new Error("CategoryRule không tồn tại");
        if (categoryRule.tournamentItemId) throw new Error("CategoryRule đã được sử dụng cho giải đấu khác");

        const timeline = {
            registrationStart: new Date(registrationStart),
            registrationEnd: new Date(registrationEnd),
            tournamentStart: new Date(tournamentStart),
            tournamentEnd: new Date(tournamentEnd),
        };

        const item = new TournamentItem({
            tournamentId: null,
            organization: userId,
            categoryRule: categoryRule._id,
            name: name || categoryRule.name,
            description: description || '',
            banner: banner || '',
            logo: logo || '',
            timeLine: timeline,
            feeEntry: 0,
            paymentQR: paymentQR || '',
            prizes: prizes || '',
            location: {
                city: location?.city || '',
                district: location?.district || '',
                detail: location?.detail || ''
            },
            galaConfig: galaConfig || { hasGala: false },
            sponsors: [],
            status: 'upcoming',
            sportType: sportType || categoryRule.sportType || '',
            maxTeams: maxTeams || 0,
            format: format || '',
            registeredTeams: 0
        });
        await item.save({ session });

        categoryRule.tournamentItemId = item._id;
        await categoryRule.save({ session });

        await session.commitTransaction();
        res.status(201).json({ message: "Tạo giải đấu thành công", data: item });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: error.message });
    } finally {
        session.endSession();
    }
};

export const createMultiSportTournament = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const userId = req.user._id;
        const {
            name, description, categoryRuleIds,
            registrationStart, registrationEnd, tournamentStart, tournamentEnd,
            location, banner, logo, prizes, galaConfig, paymentQR
        } = req.body;

        if (!categoryRuleIds || !Array.isArray(categoryRuleIds) || categoryRuleIds.length === 0) {
            throw new Error("Cần cung cấp danh sách categoryRuleIds");
        }

        const user = await User.findById(userId).populate('roles');
        const hasOrg = user.roles.some(r => r.name === 'org');
        const hasAdmin = user.roles.some(r => r.name === 'admin');
        if (!hasOrg && !hasAdmin) throw new Error("Bạn không có quyền tạo hội thao");

        const categoryRules = await CategoryRule.find({ _id: { $in: categoryRuleIds } }).session(session);
        if (categoryRules.length !== categoryRuleIds.length) throw new Error("Một số categoryRule không tồn tại");
        const used = categoryRules.some(cr => cr.tournamentItemId);
        if (used) throw new Error("Một số categoryRule đã được sử dụng");

        const timeline = {
            registrationStart: new Date(registrationStart),
            registrationEnd: new Date(registrationEnd),
            tournamentStart: new Date(tournamentStart),
            tournamentEnd: new Date(tournamentEnd),
        };

        const tournament = new Tournament({
            name,
            description: description || '',
            logo: logo || '',
            banner: banner || '',
            startDate: timeline.tournamentStart,
            endDate: timeline.tournamentEnd,
            location: {
                city: location?.city || '',
                district: location?.district || '',
                detail: location?.detail || ''
            },
            organization: userId,
            numberOfSport: categoryRuleIds.length,
            status: 'upcoming',
            tournamnetItem: []
        });
        await tournament.save({ session });

        const itemIds = [];
        for (const categoryRule of categoryRules) {
            const item = new TournamentItem({
                tournamentId: tournament._id,
                organization: userId,
                categoryRule: categoryRule._id,
                name: categoryRule.name,
                banner: banner || '',
                logo: logo || '',
                timeLine: timeline,
                feeEntry: 0,
                paymentQR: paymentQR || '',
                prizes: prizes || '',
                location: {
                    city: location?.city || '',
                    district: location?.district || '',
                    detail: location?.detail || ''
                },
                galaConfig: galaConfig || { hasGala: false },
                sponsors: [],
                status: 'upcoming',
                sportType: categoryRule.sportType || '',
                maxTeams: 0,
                format: '',
                registeredTeams: 0
            });
            await item.save({ session });
            itemIds.push(item._id);
            categoryRule.tournamentItemId = item._id;
            await categoryRule.save({ session });
        }

        tournament.tournamnetItem = itemIds;
        await tournament.save({ session });

        await session.commitTransaction();
        res.status(201).json({ message: "Tạo hội thao thành công", data: tournament });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: error.message });
    } finally {
        session.endSession();
    }
};

// ========== UPDATE ==========
export const updateSingleSportTournament = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const itemId = req.params.id;
        const updateData = req.body;

        const item = await TournamentItem.findById(itemId).session(session);
        if (!item) return res.status(404).json({ message: "Không tìm thấy giải đấu" });
        if (item.tournamentId) return res.status(400).json({ message: "API này chỉ dùng cho giải đơn môn độc lập" });

        const user = await User.findById(req.user._id).populate('roles');
        const hasAdmin = user.roles.some(r => r.name === 'admin');
        const isOwner = item.organization && item.organization.toString() === req.user._id.toString();
        if (!hasAdmin && !isOwner) return res.status(403).json({ message: "Bạn không có quyền cập nhật giải đấu này" });

        const isLocked = ['playing', 'completed'].includes(item.status);
        if (isLocked) {
            const allowed = ['description', 'banner', 'logo', 'prizes', 'paymentQR', 'galaConfig'];
            const invalid = Object.keys(updateData).some(k => !allowed.includes(k));
            if (invalid) return res.status(400).json({ message: "Giải đấu đã bắt đầu, chỉ cập nhật được thông tin hiển thị" });
        }

        // Cập nhật các field
        const fields = ['name', 'description', 'banner', 'logo', 'prizes', 'paymentQR', 'feeEntry', 'sportType', 'maxTeams', 'format', 'registeredTeams'];
        fields.forEach(f => { if (updateData[f] !== undefined) item[f] = updateData[f]; });
        if (updateData.location) item.location = { ...item.location, ...updateData.location };
        if (updateData.galaConfig) item.galaConfig = { ...item.galaConfig, ...updateData.galaConfig };
        if (updateData.timeLine && !isLocked) {
            item.timeLine = {
                registrationStart: new Date(updateData.timeLine.registrationStart),
                registrationEnd: new Date(updateData.timeLine.registrationEnd),
                tournamentStart: new Date(updateData.timeLine.tournamentStart),
                tournamentEnd: new Date(updateData.timeLine.tournamentEnd),
            };
        }

        await item.save({ session });
        await session.commitTransaction();
        res.json({ message: "Cập nhật giải đấu thành công", data: item });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: error.message });
    } finally {
        session.endSession();
    }
};

export const updateMultiSportTournament = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const tournamentId = req.params.id;
        const updateData = req.body;

        const tournament = await Tournament.findById(tournamentId).session(session);
        if (!tournament) return res.status(404).json({ message: "Không tìm thấy hội thao" });

        const user = await User.findById(req.user._id).populate('roles');
        const hasAdmin = user.roles.some(r => r.name === 'admin');
        const isOwner = tournament.organization && tournament.organization.toString() === req.user._id.toString();
        if (!hasAdmin && !isOwner) return res.status(403).json({ message: "Bạn không có quyền cập nhật hội thao này" });

        const isLocked = ['playing', 'completed'].includes(tournament.status);
        if (isLocked) {
            const allowed = ['description', 'banner', 'logo'];
            const invalid = Object.keys(updateData).some(k => !allowed.includes(k));
            if (invalid) return res.status(400).json({ message: "Hội thao đã bắt đầu, chỉ cập nhật được mô tả, banner, logo" });
        }

        const fields = ['name', 'description', 'banner', 'logo'];
        fields.forEach(f => { if (updateData[f] !== undefined) tournament[f] = updateData[f]; });
        if (updateData.location) tournament.location = { ...tournament.location, ...updateData.location };
        if (updateData.startDate) tournament.startDate = new Date(updateData.startDate);
        if (updateData.endDate) tournament.endDate = new Date(updateData.endDate);

        if (updateData.timeLine && !isLocked) {
            const timeline = {
                registrationStart: new Date(updateData.timeLine.registrationStart),
                registrationEnd: new Date(updateData.timeLine.registrationEnd),
                tournamentStart: new Date(updateData.timeLine.tournamentStart),
                tournamentEnd: new Date(updateData.timeLine.tournamentEnd),
            };
            await TournamentItem.updateMany({ tournamentId: tournament._id }, { timeLine: timeline }, { session });
            tournament.startDate = timeline.tournamentStart;
            tournament.endDate = timeline.tournamentEnd;
        }

        if (!isLocked && updateData.addCategoryRuleIds) {
            const newCategoryRuleIds = updateData.addCategoryRuleIds;
            const newRules = await CategoryRule.find({ _id: { $in: newCategoryRuleIds } }).session(session);
            if (newRules.length !== newCategoryRuleIds.length) throw new Error("Một số categoryRule không tồn tại");
            const used = newRules.some(cr => cr.tournamentItemId);
            if (used) throw new Error("Một số categoryRule đã được sử dụng");
            let timeline;
            if (updateData.timeLine) {
                timeline = {
                    registrationStart: new Date(updateData.timeLine.registrationStart),
                    registrationEnd: new Date(updateData.timeLine.registrationEnd),
                    tournamentStart: new Date(updateData.timeLine.tournamentStart),
                    tournamentEnd: new Date(updateData.timeLine.tournamentEnd),
                };
            } else {
                const firstItem = await TournamentItem.findOne({ tournamentId: tournament._id }).session(session);
                timeline = firstItem ? firstItem.timeLine : {
                    registrationStart: new Date(),
                    registrationEnd: new Date(),
                    tournamentStart: new Date(),
                    tournamentEnd: new Date(),
                };
            }
            const newItems = [];
            for (const rule of newRules) {
                const item = new TournamentItem({
                    tournamentId: tournament._id,
                    organization: tournament.organization,
                    categoryRule: rule._id,
                    name: rule.name,
                    banner: tournament.banner,
                    logo: tournament.logo,
                    timeLine: timeline,
                    feeEntry: 0,
                    paymentQR: "",
                    prizes: tournament.prizes || "",
                    location: { city: "", district: "", detail: "" },
                    galaConfig: { hasGala: false },
                    status: 'upcoming',
                    sportType: rule.sportType || '',
                    maxTeams: 0,
                    format: '',
                    registeredTeams: 0
                });
                await item.save({ session });
                newItems.push(item._id);
                rule.tournamentItemId = item._id;
                await rule.save({ session });
            }
            tournament.numberOfSport += newItems.length;
            tournament.tournamnetItem.push(...newItems);
        }

        await tournament.save({ session });
        await session.commitTransaction();
        res.json({ message: "Cập nhật hội thao thành công", data: tournament });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: error.message });
    } finally {
        session.endSession();
    }
};

// ========== DELETE (SOFT DELETE) ==========
export const softDeleteSingleTournament = async (req, res) => {
    try {
        const itemId = req.params.id;
        const item = await TournamentItem.findById(itemId);
        if (!item) return res.status(404).json({ message: "Không tìm thấy giải đấu" });
        if (item.tournamentId) return res.status(400).json({ message: "API này chỉ dùng cho giải đơn môn độc lập" });

        const user = await User.findById(req.user._id).populate('roles');
        const hasAdmin = user.roles.some(r => r.name === 'admin');
        const isOwner = item.organization && item.organization.toString() === req.user._id.toString();
        if (!hasAdmin && !isOwner) return res.status(403).json({ message: "Bạn không có quyền" });

        if (['playing', 'completed'].includes(item.status)) {
            return res.status(400).json({ message: `Không thể hủy giải đấu đang ${item.status}` });
        }
        item.status = 'cancelled';
        await item.save();
        res.json({ message: "Đã hủy giải đấu", data: item });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const softDeleteMultiTournament = async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) return res.status(404).json({ message: "Không tìm thấy hội thao" });

        const user = await User.findById(req.user._id).populate('roles');
        const hasAdmin = user.roles.some(r => r.name === 'admin');
        const isOwner = tournament.organization && tournament.organization.toString() === req.user._id.toString();
        if (!hasAdmin && !isOwner) return res.status(403).json({ message: "Bạn không có quyền" });

        if (['playing', 'completed'].includes(tournament.status)) {
            return res.status(400).json({ message: `Không thể hủy hội thao đang ${tournament.status}` });
        }
        tournament.status = 'cancelled';
        await tournament.save();
        await TournamentItem.updateMany({ tournamentId: tournament._id }, { status: 'cancelled' });
        res.json({ message: "Đã hủy hội thao", data: tournament });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ========== CHANGE STATUS ==========
export const changeSingleStatus = async (req, res) => {
    try {
        const itemId = req.params.id;
        const item = await TournamentItem.findById(itemId);
        if (!item) return res.status(404).json({ message: "Không tìm thấy giải đấu" });
        if (item.tournamentId) return res.status(400).json({ message: "API này chỉ dùng cho giải đơn môn độc lập" });

        const { newStatus } = req.body;
        const allowed = ['upcoming', 'actived', 'playing', 'completed', 'cancelled'];
        if (!allowed.includes(newStatus)) return res.status(400).json({ message: "Trạng thái không hợp lệ" });
        if (['playing', 'completed'].includes(item.status)) {
            return res.status(400).json({ message: `Không thể thay đổi trạng thái khi giải đã ${item.status}` });
        }

        const user = await User.findById(req.user._id).populate('roles');
        const hasAdmin = user.roles.some(r => r.name === 'admin');
        const isOwner = item.organization && item.organization.toString() === req.user._id.toString();
        if (!hasAdmin && !isOwner) return res.status(403).json({ message: "Bạn không có quyền" });

        item.status = newStatus;
        await item.save();
        res.json({ message: `Đã chuyển trạng thái sang ${newStatus}`, data: item });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const changeMultiStatus = async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) return res.status(404).json({ message: "Không tìm thấy hội thao" });

        const { newStatus } = req.body;
        const allowed = ['upcoming', 'actived', 'playing', 'completed', 'cancelled'];
        if (!allowed.includes(newStatus)) return res.status(400).json({ message: "Trạng thái không hợp lệ" });
        if (['playing', 'completed'].includes(tournament.status)) {
            return res.status(400).json({ message: `Không thể thay đổi trạng thái khi hội thao đã ${tournament.status}` });
        }

        const user = await User.findById(req.user._id).populate('roles');
        const hasAdmin = user.roles.some(r => r.name === 'admin');
        const isOwner = tournament.organization && tournament.organization.toString() === req.user._id.toString();
        if (!hasAdmin && !isOwner) return res.status(403).json({ message: "Bạn không có quyền" });

        tournament.status = newStatus;
        await tournament.save();
        if (newStatus === 'cancelled') {
            await TournamentItem.updateMany({ tournamentId: tournament._id }, { status: 'cancelled' });
        }
        res.json({ message: `Đã chuyển trạng thái hội thao sang ${newStatus}`, data: tournament });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};