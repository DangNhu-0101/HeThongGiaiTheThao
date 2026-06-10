import mongoose from 'mongoose';
import Tournament from '../models/tournaments.js';
import Organization from '../models/orgs.js';
import User from '../models/users.js';
import Player from '../models/players.js';


export const getAllTournaments = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, sportType, organizerId, sortBy = 'createdAt', order = 'desc' } = req.query;
        const filter = {};

        if (status) {
            const statusList = status.split(',');
            filter.status = statusList.length === 1 ? statusList[0] : { $in: statusList };
        }
        if (sportType) {
            const sportTypeList = sportType.split(',');
            filter.sportType = { $in: sportTypeList };
        }
        if (organizerId) {
            const orgList = organizerId.split(',');
            filter.organizer = orgList.length === 1 ? orgList[0] : { $in: orgList };
        }

        const sort = { [sortBy]: order === 'desc' ? -1 : 1 };
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = parseInt(limit);

        const tournaments = await Tournament.find(filter)
            .populate('organizer', 'name logo')
            .sort(sort)
            .skip(skip)
            .limit(limitNum);

        const total = await Tournament.countDocuments(filter);

        return res.status(200).json({
            data: tournaments,
            pagination: {
                page: parseInt(page),
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error("Lỗi trong getAllTournaments:", error);
        return res.status(500).json({ message: error.message });
    }
};

// GET /api/tournaments/organization/my?page=1&limit=10&status=upcoming&sportType=Football
export const getTournamentByOrganization = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "Người dùng không tồn tại" });

        const hasAdminRole = user.roleNames.includes('admin');
        let orgFilter = {};

        if (!hasAdminRole) {
            const organization = await Organization.findOne({ ownerId: userId });
            if (!organization) {
                return res.status(404).json({ message: "Bạn chưa có tổ chức nào" });
            }
            orgFilter = { organizer: organization._id };
        } else {
            // Admin: nếu có query organizationId thì lọc theo, không thì lấy tất cả
            const { organizationId } = req.query;
            if (organizationId) {
                orgFilter = { organizer: organizationId };
            }
        }

        const { page = 1, limit = 10, status, sportType } = req.query;
        const filter = { ...orgFilter };
        if (status) filter.status = status;
        if (sportType) filter.sportType = { $in: sportType.split(',') };

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = parseInt(limit);

        const tournaments = await Tournament.find(filter)
            .populate('organizer', 'name logo')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await Tournament.countDocuments(filter);

        return res.status(200).json({
            data: tournaments,
            pagination: {
                page: parseInt(page),
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error("Lỗi trong getTournamentByOrganization:", error);
        return res.status(500).json({ message: error.message });
    }
};

// GET /api/tournaments/:id
export const getTournamentById = async (req, res) => {
    try {
        const { id } = req.params;
        const tournament = await Tournament.findById(id)
            .populate('organizer', 'name logo contactEmail contactPhone address')
            .populate('baseRule'); // baseRule là array ObjectId ref SportRule

        if (!tournament) {
            return res.status(404).json({ message: "Không tìm thấy giải đấu" });
        }

        // Kiểm tra quyền xem nếu giải bị cancelled
        const userId = req.user?._id;
        let canView = true;
        if (tournament.status === 'cancelled') {
            if (!userId) {
                canView = false;
            } else {
                const user = await User.findById(userId);
                if (user) {
                    const hasAdminRole = user.roleNames.includes('admin');
                    const isOwner = await Organization.findOne({ _id: tournament.organizer, ownerId: userId });
                    if (!hasAdminRole && !isOwner) {
                        canView = false;
                    }
                } else {
                    canView = false;
                }
            }
        }

        if (!canView) {
            return res.status(403).json({ message: "Bạn không có quyền xem giải đấu đã bị hủy" });
        }

        return res.status(200).json(tournament);
    } catch (error) {
        console.error("Lỗi trong getTournamentById:", error);
        return res.status(500).json({ message: error.message });
    }
};

export const createTournament = async (req, res) => {
    try {
        const userId = req.user._id;
        const {
            name, description, sportType,
            registrationStart, registrationEnd,
            tournamentStart, tournamentEnd,
            location, organizationId, baseRuleIds,
            banner, logo, prizes, galaConfig, budget, paymentQR
        } = req.body;

        // 1. Kiểm tra user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Người dùng không tồn tại" });
        }

        // 2. Kiểm tra vai trò
        const hasOrgRole = user.roleNames.includes('org');
        const hasAdminRole = user.roleNames.includes('admin');
        if (!hasOrgRole && !hasAdminRole) {
            return res.status(403).json({
                message: "Bạn không có quyền tạo giải đấu. Chỉ tổ chức (org) hoặc quản trị viên (admin) mới được phép."
            });
        }

        // 3. Kiểm tra sportType
        if (!sportType || !Array.isArray(sportType) || sportType.length === 0) {
            return res.status(400).json({ message: "Vui lòng cung cấp sportType là mảng các môn thể thao." });
        }

        // 4. Xử lý organizationId
        let finalOrganizationId = null;
        if (hasOrgRole) {
            const organization = await Organization.findOne({ ownerId: userId });
            if (!organization) {
                return res.status(400).json({ message: "Bạn chưa có tổ chức nào. Vui lòng tạo tổ chức trước." });
            }
            finalOrganizationId = organization._id;
        } else if (hasAdminRole) {
            if (!organizationId) {
                return res.status(400).json({ message: "Admin cần cung cấp organizationId." });
            }
            const organization = await Organization.findById(organizationId);
            if (!organization) {
                return res.status(404).json({ message: "Tổ chức không tồn tại" });
            }
            finalOrganizationId = organization._id;
        }

        // 5. Xử lý thời gian
        const parseDate = (dateStr, fieldName) => {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) {
                throw new Error(`${fieldName} không hợp lệ`);
            }
            return d;
        };

        let regStart, regEnd, tourStart, tourEnd;
        try {
            regStart = parseDate(registrationStart, 'registrationStart');
            regEnd = parseDate(registrationEnd, 'registrationEnd');
            tourStart = parseDate(tournamentStart, 'tournamentStart');
            tourEnd = parseDate(tournamentEnd, 'tournamentEnd');
        } catch (err) {
            return res.status(400).json({ message: err.message });
        }

        // 6. Xử lý galaConfig
        const finalGalaConfig = {
            hasGala: galaConfig?.hasGala || false,
            time: galaConfig?.time ? new Date(galaConfig.time) : null,
            venue: galaConfig?.venue || "",
            description: galaConfig?.description || ""
        };

        // 7. Xử lý budget
        const finalBudget = {
            totalSponsor: budget?.totalSponsor || 0,
            totalExpense: budget?.totalExpense || 0
        };

        // 8. Tạo tournament
        const newTournament = new Tournament({
            name,
            description: description || "",
            sportType,
            timeLine: {
                registrationStart: regStart,
                registrationEnd: regEnd,
                tournamentStart: tourStart,
                tournamentEnd: tourEnd
            },
            location: {
                city: location?.city || "",
                district: location?.district || ""
            },
            organizer: finalOrganizationId,
            baseRule: baseRuleIds || [],
            banner: banner || "",
            logo: logo || "",
            prizes: prizes || "",
            galaConfig: finalGalaConfig,
            budget: finalBudget,
            paymentQR: paymentQR || "",
            sponsors: [],
            status: 'upcoming'
        });

        await newTournament.save();

        return res.status(201).json({
            message: "Tạo giải đấu thành công",
            tournament: newTournament
        });

    } catch (error) {
        console.error("Lỗi trong createTournament:", error);
        return res.status(500).json({ message: error.message });
    }
};

export const updateTournament = async (req, res) => {
    try {
        const userId = req.user._id;
        const { tournamentId } = req.params;
        const updateData = req.body;

        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) {
            return res.status(404).json({ message: "Giải đấu không tồn tại" });
        }

        // Kiểm tra quyền
        const user = await User.findById(userId);
        const hasAdminRole = user.roleNames.includes('admin');
        const isOwner = await Organization.findOne({ _id: tournament.organizer, ownerId: userId });
        if (!hasAdminRole && !isOwner) {
            return res.status(403).json({ message: "Bạn không có quyền cập nhật giải đấu này" });
        }

        // Nếu giải đang playing hoặc completed, chỉ cho phép update một số field nhẹ
        const isLocked = ['playing', 'completed'].includes(tournament.status);

        // Danh sách field được phép cập nhật khi bị khóa (chỉ thông tin hiển thị)
        const safeFieldsWhenLocked = ['description', 'banner', 'logo', 'prizes', 'paymentQR', 'galaConfig'];
        // Danh sách field cần kiểm soát chặt (không cho update khi đã playing/completed)
        const criticalFields = ['sportType', 'timeLine', 'baseRule', 'name', 'location', 'budget'];

        if (isLocked) {
            // Kiểm tra xem có field quan trọng nào bị thay đổi không
            const hasCriticalUpdate = criticalFields.some(field => {
                if (field === 'timeLine') return updateData.timeLine !== undefined;
                if (field === 'baseRule') return updateData.baseRuleIds !== undefined || updateData.baseRule !== undefined;
                return updateData[field] !== undefined;
            });
            if (hasCriticalUpdate) {
                return res.status(400).json({ message: `Giải đấu đã ${tournament.status}, không thể cập nhật cấu hình quan trọng (sportType, timeline, baseRule, tên, địa điểm, ngân sách).` });
            }
        }

        // Các field được phép update (bao gồm cả baseRuleIds)
        const allowedUpdates = [
            'name', 'description', 'sportType', 'banner', 'logo', 'prizes',
            'timeLine.registrationStart', 'timeLine.registrationEnd',
            'timeLine.tournamentStart', 'timeLine.tournamentEnd',
            'location.city', 'location.district', 'galaConfig', 'budget', 'paymentQR',
            'baseRuleIds'  // thêm dòng này để cho phép update baseRule
        ];

        // Áp dụng update
        allowedUpdates.forEach(field => {
            let value;
            if (field === 'baseRuleIds') {
                value = updateData.baseRuleIds; // lấy trực tiếp từ body
            } else {
                value = field.includes('.')
                    ? field.split('.').reduce((obj, key) => obj?.[key], updateData)
                    : updateData[field];
            }
            if (value !== undefined) {
                if (field === 'baseRuleIds') {
                    tournament.baseRule = value; // baseRule là mảng ObjectId
                } else if (field.includes('.')) {
                    const [parent, child] = field.split('.');
                    if (!tournament[parent]) tournament[parent] = {};
                    tournament[parent][child] = value;
                } else {
                    tournament[field] = value;
                }
            }
        });

        // Xử lý ngày tháng nếu có
        if (updateData.timeLine && !isLocked) {
            if (updateData.timeLine.registrationStart) tournament.timeLine.registrationStart = new Date(updateData.timeLine.registrationStart);
            if (updateData.timeLine.registrationEnd) tournament.timeLine.registrationEnd = new Date(updateData.timeLine.registrationEnd);
            if (updateData.timeLine.tournamentStart) tournament.timeLine.tournamentStart = new Date(updateData.timeLine.tournamentStart);
            if (updateData.timeLine.tournamentEnd) tournament.timeLine.tournamentEnd = new Date(updateData.timeLine.tournamentEnd);
        }

        // Nếu cập nhật galaConfig.time thì chuyển thành Date
        if (updateData.galaConfig && updateData.galaConfig.time) {
            tournament.galaConfig.time = new Date(updateData.galaConfig.time);
        }

        await tournament.save();
        return res.status(200).json({ message: "Cập nhật giải đấu thành công", tournament });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};

export const softDeleteTournament = async (req, res) => {
    try {
        const userId = req.user._id;
        const { tournamentId } = req.params;

        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) {
            return res.status(404).json({ message: "Giải đấu không tồn tại" });
        }

        // ✅ Không cho soft delete nếu đã playing hoặc completed
        const blockedStatuses = ['playing', 'completed'];
        if (blockedStatuses.includes(tournament.status)) {
            return res.status(400).json({
                message: `Không thể hủy giải đấu đang ở trạng thái ${tournament.status}.`
            });
        }

        const user = await User.findById(userId);
        const hasAdminRole = user.roleNames.includes('admin');
        const isOwner = await Organization.findOne({ _id: tournament.organizer, ownerId: userId });

        if (!hasAdminRole && !isOwner) {
            return res.status(403).json({ message: "Bạn không có quyền hủy giải đấu này" });
        }

        tournament.status = 'cancelled';
        await tournament.save();

        return res.status(200).json({ message: "Giải đấu đã bị hủy (soft delete)", tournament });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};


export const changeTournamentStatus = async (req, res) => {
    try {
        const userId = req.user._id;
        const { tournamentId } = req.params;
        const { newStatus } = req.body;

        const allowedStatuses = ['upcoming', 'actived', 'playing', 'completed', 'cancelled'];
        if (!newStatus || !allowedStatuses.includes(newStatus)) {
            return res.status(400).json({ message: "Status không hợp lệ. Cho phép: " + allowedStatuses.join(', ') });
        }

        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) {
            return res.status(404).json({ message: "Giải đấu không tồn tại" });
        }

        // ✅ CHẶN: nếu đã playing hoặc completed thì không được chuyển nữa
        const blockedStatuses = ['playing', 'completed'];
        if (blockedStatuses.includes(tournament.status)) {
            return res.status(400).json({
                message: `Giải đấu đã ở trạng thái ${tournament.status}, không thể thay đổi trạng thái.`
            });
        }

        const user = await User.findById(userId);
        const hasAdminRole = user.roleNames.includes('admin');
        const isOwner = await Organization.findOne({ _id: tournament.organizer, ownerId: userId });

        if (!hasAdminRole && !isOwner) {
            return res.status(403).json({ message: "Bạn không có quyền thay đổi trạng thái giải đấu" });
        }

        // Logic thứ tự (không bắt buộc, nhưng gợi ý)
        const statusOrder = ['upcoming', 'actived', 'playing', 'completed'];
        const currentIdx = statusOrder.indexOf(tournament.status);
        const newIdx = statusOrder.indexOf(newStatus);
        if (!hasAdminRole && newIdx < currentIdx && tournament.status !== 'cancelled') {
            return res.status(400).json({ message: "Bạn không thể quay lại trạng thái cũ trừ khi có quyền admin" });
        }

        tournament.status = newStatus;
        await tournament.save();

        return res.status(200).json({ message: `Đã chuyển trạng thái giải sang ${newStatus}`, tournament });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};
