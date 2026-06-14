// controllers/tournamentController.js
import mongoose from 'mongoose';
import Tournament from '../models/tournaments.js';
import TournamentItem from '../models/tournamentItem.js';
import CategoryRule from '../models/rules/categories.js';
import Organization from '../models/orgs.js';
import User from '../models/users.js';

// Helper parse date
const parseDate = (dateStr, fieldName) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) throw new Error(`${fieldName} không hợp lệ`);
    return d;
};

// ========== GET ==========
export const getAllTournaments = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, organizerId, sortBy = 'createdAt', order = 'desc' } = req.query;
        const filter = {};
        if (status) filter.status = { $in: status.split(',') };
        if (organizerId) filter.organization = { $in: organizerId.split(',') };
        const tournaments = await Tournament.find(filter)
            .populate('organization', 'name logo')
            .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));
        const total = await Tournament.countDocuments(filter);
        res.json({ data: tournaments, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
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
        let orgFilter = {};
        if (!hasAdmin) {
            const org = await Organization.findOne({ ownerId: currentUser });
            if (!org) return res.status(404).json({ message: "Bạn chưa có tổ chức" });
            orgFilter = { organization: org._id };
        } else if (req.query.organizationId) {
            orgFilter = { organization: req.query.organizationId };
        }
        const { status } = req.query;
        const filter = { ...orgFilter };
        if (status) filter.status = status;
        const tournaments = await Tournament.find(filter).populate('organization', 'name logo').sort({ createdAt: -1 });
        res.json({ data: tournaments });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getTournamentById = async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id)
            .populate('organization', 'name logo')
            .populate({
                path: 'tournamnetItem',
                populate: { path: 'categoryRule', populate: ['gameRule', 'scoringRule', 'timeManagementRule', 'resourceManagementRule', 'faultsAndPenaltiesRule'] }
            });
        if (!tournament) return res.status(404).json({ message: "Không tìm thấy hội thao" });
        // Nếu cần kiểm tra quyền khi cancelled
        if (tournament.status === 'cancelled') {
            const user = await User.findById(req.user._id).populate('roles');
            const hasAdmin = user?.roles.some(r => r.name === 'admin');
            const isOwner = await Organization.findOne({ _id: tournament.organization, ownerId: req.user._id });
            if (!hasAdmin && !isOwner) return res.status(403).json({ message: "Bạn không có quyền xem hội thao đã bị hủy" });
        }
        res.json(tournament);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Lấy chi tiết giải đơn môn (TournamentItem)
export const getSingleTournamentById = async (req, res) => {
    try {
        const item = await TournamentItem.findById(req.params.id)
            .populate('organization', 'name logo')
            .populate({
                path: 'categoryRule',
                populate: ['gameRule', 'scoringRule', 'timeManagementRule', 'resourceManagementRule', 'faultsAndPenaltiesRule']
            });
        if (!item) return res.status(404).json({ message: "Không tìm thấy giải đấu" });
        // Nếu cần kiểm tra quyền khi cancelled
        if (item.status === 'cancelled') {
            const user = await User.findById(req.user._id).populate('roles');
            const hasAdmin = user?.roles.some(r => r.name === 'admin');
            const isOwner = await Organization.findOne({ _id: item.organization, ownerId: req.user._id });
            if (!hasAdmin && !isOwner) return res.status(403).json({ message: "Bạn không có quyền xem giải đấu đã bị hủy" });
        }
        res.json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ========== CREATE ==========
// Tạo giải đơn môn (TournamentItem)
export const createSingleSportTournament = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const userId = req.user._id;
        const {
            name, description, categoryRuleId,
            registrationStart, registrationEnd, tournamentStart, tournamentEnd,
            location, organizationId, banner, logo, prizes, galaConfig, paymentQR
        } = req.body;

        if (!categoryRuleId) throw new Error("Thiếu categoryRuleId");

        // Kiểm tra quyền
        const user = await User.findById(userId).populate('roles');
        const hasOrg = user.roles.some(r => r.name === 'org');
        const hasAdmin = user.roles.some(r => r.name === 'admin');
        if (!hasOrg && !hasAdmin) throw new Error("Bạn không có quyền tạo giải đấu");

        let finalOrgId;
        if (hasOrg) {
            const org = await Organization.findOne({ ownerId: userId });
            if (!org) throw new Error("Bạn chưa có tổ chức");
            finalOrgId = org._id;
        } else {
            if (!organizationId) throw new Error("Admin cần cung cấp organizationId");
            const org = await Organization.findById(organizationId);
            if (!org) throw new Error("Tổ chức không tồn tại");
            finalOrgId = org._id;
        }

        // Kiểm tra categoryRule
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
            organization: finalOrgId,
            categoryRule: categoryRule._id,
            name: name || categoryRule.name,
            description,
            banner: banner || "",
            logo: logo || "",
            timeLine: timeline,
            feeEntry: 0,
            paymentQR: paymentQR || "",
            prizes: prizes || "",
            location: { city: location?.city || "", district: location?.district || "" },
            galaConfig: galaConfig || { hasGala: false },
            sponsors: [],
            status: 'upcoming'
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

// Tạo hội thao đa môn (Tournament + nhiều TournamentItem)
export const createMultiSportTournament = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const userId = req.user._id;
        const {
            name, description, categoryRuleIds, // mảng các categoryRuleId
            registrationStart, registrationEnd, tournamentStart, tournamentEnd,
            location, organizationId, banner, logo, prizes, galaConfig, paymentQR
        } = req.body;

        if (!categoryRuleIds || !Array.isArray(categoryRuleIds) || categoryRuleIds.length === 0) {
            throw new Error("Cần cung cấp danh sách categoryRuleIds");
        }

        // Kiểm tra quyền
        const user = await User.findById(userId).populate('roles');
        const hasOrg = user.roles.some(r => r.name === 'org');
        const hasAdmin = user.roles.some(r => r.name === 'admin');
        if (!hasOrg && !hasAdmin) throw new Error("Bạn không có quyền tạo hội thao");

        let finalOrgId;
        if (hasOrg) {
            const org = await Organization.findOne({ ownerId: userId });
            if (!org) throw new Error("Bạn chưa có tổ chức");
            finalOrgId = org._id;
        } else {
            if (!organizationId) throw new Error("Admin cần cung cấp organizationId");
            const org = await Organization.findById(organizationId);
            if (!org) throw new Error("Tổ chức không tồn tại");
            finalOrgId = org._id;
        }

        // Kiểm tra tất cả categoryRule tồn tại và chưa dùng
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

        // Tạo Tournament
        const tournament = new Tournament({
            name,
            description: description || "",
            logo: logo || "",
            banner: banner || "",
            startDate: timeline.tournamentStart,
            endDate: timeline.tournamentEnd,
            location: location?.city ? `${location.city}, ${location.district || ''}` : "",
            organization: finalOrgId,
            numberOfSport: categoryRuleIds.length,
            status: 'upcoming',
            tournamnetItem: []
        });
        await tournament.save({ session });

        // Tạo các TournamentItem
        const itemIds = [];
        for (const categoryRule of categoryRules) {
            const item = new TournamentItem({
                tournamentId: tournament._id,
                organization: finalOrgId,
                categoryRule: categoryRule._id,
                name: categoryRule.name,
                banner: banner || "",
                logo: logo || "",
                timeLine: timeline,
                feeEntry: 0,
                paymentQR: paymentQR || "",
                prizes: prizes || "",
                location: { city: location?.city || "", district: location?.district || "" },
                galaConfig: galaConfig || { hasGala: false },
                sponsors: [],
                status: 'upcoming'
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
// Cập nhật giải đơn môn (TournamentItem)
export const updateSingleSportTournament = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const itemId = req.params.id;
        const updateData = req.body;

        const item = await TournamentItem.findById(itemId).session(session);
        if (!item) return res.status(404).json({ message: "Không tìm thấy giải đấu" });

        if (item.tournamentId) {
            return res.status(400).json({ message: "API này chỉ dùng cho giải đấu đơn môn độc lập" });
        }

        // Kiểm tra quyền
        const user = await User.findById(req.user._id).populate('roles');
        const hasAdmin = user.roles.some(r => r.name === 'admin');
        const isOwner = await Organization.findOne({ _id: item.organization, ownerId: req.user._id });
        if (!hasAdmin && !isOwner) {
            return res.status(403).json({ message: "Bạn không có quyền cập nhật giải đấu này" });
        }

        const isLocked = ['playing', 'completed'].includes(item.status);
        if (isLocked) {
            const allowed = ['description', 'banner', 'logo', 'prizes', 'paymentQR', 'galaConfig'];
            const invalid = Object.keys(updateData).some(k => !allowed.includes(k));
            if (invalid) {
                return res.status(400).json({ message: "Giải đấu đã bắt đầu, chỉ cập nhật được thông tin hiển thị" });
            }
        }

        // Cập nhật
        if (updateData.name) item.name = updateData.name;
        if (updateData.description) item.description = updateData.description;
        if (updateData.banner) item.banner = updateData.banner;
        if (updateData.logo) item.logo = updateData.logo;
        if (updateData.prizes) item.prizes = updateData.prizes;
        if (updateData.paymentQR) item.paymentQR = updateData.paymentQR;
        if (updateData.location) item.location = { ...item.location, ...updateData.location };
        if (updateData.galaConfig) item.galaConfig = { ...item.galaConfig, ...updateData.galaConfig };
        if (updateData.feeEntry !== undefined) item.feeEntry = updateData.feeEntry;
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

// Cập nhật hội thao (Tournament)
export const updateMultiSportTournament = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const tournamentId = req.params.id;
        const updateData = req.body;

        const tournament = await Tournament.findById(tournamentId).session(session);
        if (!tournament) return res.status(404).json({ message: "Không tìm thấy hội thao" });

        // Kiểm tra quyền
        const user = await User.findById(req.user._id).populate('roles');
        const hasAdmin = user.roles.some(r => r.name === 'admin');
        const isOwner = await Organization.findOne({ _id: tournament.organization, ownerId: req.user._id });
        if (!hasAdmin && !isOwner) {
            return res.status(403).json({ message: "Bạn không có quyền cập nhật hội thao này" });
        }

        const isLocked = ['playing', 'completed'].includes(tournament.status);
        if (isLocked) {
            const allowed = ['description', 'banner', 'logo'];
            const invalid = Object.keys(updateData).some(k => !allowed.includes(k));
            if (invalid) {
                return res.status(400).json({ message: "Hội thao đã bắt đầu, chỉ cập nhật được mô tả, banner, logo" });
            }
        }

        if (updateData.name) tournament.name = updateData.name;
        if (updateData.description) tournament.description = updateData.description;
        if (updateData.banner) tournament.banner = updateData.banner;
        if (updateData.logo) tournament.logo = updateData.logo;
        if (updateData.location && typeof updateData.location === 'string') tournament.location = updateData.location;
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

        // Thêm môn mới (nếu có)
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
                    location: { city: "", district: "" },
                    galaConfig: { hasGala: false },
                    status: 'upcoming'
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
        // Kiểm tra quyền
        const user = await User.findById(req.user._id).populate('roles');
        const hasAdmin = user.roles.some(r => r.name === 'admin');
        const isOwner = await Organization.findOne({ _id: item.organization, ownerId: req.user._id });
        if (!hasAdmin && !isOwner) return res.status(403).json({ message: "Bạn không có quyền" });
        if (['playing', 'completed'].includes(item.status)) {
            return res.status(400).json({ message: `Không thể hủy giải đấu đang ${item.status}` });
        }
        item.status = 'cancelled';
        await item.save();
        // Có thể cập nhật categoryRule? Tùy chọn
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
        const isOwner = await Organization.findOne({ _id: tournament.organization, ownerId: req.user._id });
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
        const isOwner = await Organization.findOne({ _id: item.organization, ownerId: req.user._id });
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
        const isOwner = await Organization.findOne({ _id: tournament.organization, ownerId: req.user._id });
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