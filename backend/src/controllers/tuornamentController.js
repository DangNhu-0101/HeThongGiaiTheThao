// controllers/tournamentController.js
import Tournament from '../models/tournaments.js';
import TournamentItem from '../models/tournamentItem.js';
import User from '../models/users.js';
import Participant from '../models/participants.js';
import Match from '../models/matches.js';
import TournamentService from '../services/tournamentService.js';
import { buildTournamentOverviewPdf } from '../services/pdf/templates/tournamentReportTemplate.js';
import { safePdfFileName } from '../services/pdf/pdfExportService.js';
import { checkPermission, buildTimeline } from '../utils/tournamentHelper.js';
import { decorateTournamentItems, decorateTournamentWithItems } from '../utils/tournamentState.js';

// ========== GET ==========
export const getPublicTournamentStats = async (req, res) => {
    try {
        const now = new Date();
        const publicItemFilter = { status: { $ne: 'cancelled' } };
        const publicItems = await decorateTournamentItems(await TournamentItem.find(publicItemFilter).select('_id status timeLine sportType').lean());
        const itemIds = publicItems.map((item) => item._id);
        const activeItemIds = publicItems.filter((item) => !['cancelled', 'completed'].includes(item.status)).map((item) => item._id);

        const validParticipantFilter = {
            tournamentItemId: { $in: itemIds },
            type: 'team',
            registrationStatus: { $nin: ['rejected', 'suspended'] },
        };
        const matchFilter = {
            tournamentItemId: { $in: itemIds },
            status: { $nin: ['cancelled', 'canceled', 'deleted'] },
        };

        const [
            openRegistrationTournaments,
            totalTeams,
            sports,
            athleteRows,
            totalMatches,
            upcomingMatches,
            completedMatches,
            feeRows,
        ] = await Promise.all([
            TournamentItem.countDocuments({
                _id: { $in: activeItemIds },
                'timeLine.registrationStart': { $lte: now },
                'timeLine.registrationEnd': { $gte: now },
            }),
            Participant.countDocuments(validParticipantFilter),
            TournamentItem.distinct('sportType', publicItemFilter),
            Participant.aggregate([
                { $match: validParticipantFilter },
                { $unwind: '$lineup' },
                { $match: { 'lineup.Player': { $ne: null } } },
                { $group: { _id: '$lineup.Player' } },
                { $count: 'total' },
            ]),
            Match.countDocuments(matchFilter),
            Match.countDocuments({
                ...matchFilter,
                status: { $nin: ['completed', 'cancelled', 'canceled', 'deleted'] },
                scheduledTime: { $gte: now },
            }),
            Match.countDocuments({
                ...matchFilter,
                status: { $in: ['completed'] },
            }),
            Participant.aggregate([
                { $match: validParticipantFilter },
                { $unwind: '$memberFees' },
                { $match: { 'memberFees.status': 'paid' } },
                { $group: { _id: null, total: { $sum: { $ifNull: ['$memberFees.amountPaid', '$memberFees.amount'] } } } },
            ]),
        ]);

        const totalSports = sports.filter((sport) => String(sport || '').trim()).length;
        const ongoingTournaments = publicItems.filter((item) => item.status === 'playing').length;

        res.json({
            success: true,
            data: {
                totalTournaments: publicItems.length,
                openRegistrationTournaments,
                ongoingTournaments,
                totalTeams,
                totalSports,
                totalAthletesOrRegistrations: athleteRows[0]?.total || 0,
                totalMatches,
                upcomingMatches,
                completedMatches,
                collectedAmount: feeRows[0]?.total || 0,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllTournaments = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, organizerId, sortBy = 'createdAt', order = 'desc' } = req.query;
        const filter = {};
        if (status) filter.status = { $in: status.split(',') };
        if (organizerId) filter.organization = { $in: organizerId.split(',') };
        const tournaments = await Tournament.find(filter)
            .populate('organization', 'name username fullName logo email')
            .populate('tournamnetItem')
            .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit))
            .lean();
        const total = await Tournament.countDocuments(filter);
        const decorated = await decorateTournamentWithItems(tournaments);
        res.json({ data: decorated, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllSingleSportTournaments = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, sportType, organizerId, sortBy = 'createdAt', order = 'desc' } = req.query;
        const filter = { tournamentId: null };
        if (status) filter.status = { $in: status.split(',') };
        if (sportType) filter.sportType = sportType;
        if (organizerId) filter.organization = { $in: organizerId.split(',') };

        const sort = { [sortBy]: order === 'desc' ? -1 : 1 };
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = parseInt(limit);

        const tournaments = await TournamentItem.find(filter)
            .populate('organization', 'name username fullName logo email')
            .populate({
                path: 'categoryRule',
                populate: ['gameRule', 'scoringRule', 'timeManagementRule', 'resourceManagementRule', 'faultsAndPenaltiesRule']
            })
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .lean();

        const total = await TournamentItem.countDocuments(filter);
        const decorated = await decorateTournamentItems(tournaments);

        res.json({
            data: decorated,
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

export const getOpenRegistrationTournamentItems = async (req, res) => {
    try {
        const now = new Date();
        const filter = {
            status: { $nin: ['completed', 'cancelled'] },
            'timeLine.registrationStart': { $lte: now },
            'timeLine.registrationEnd': { $gte: now }
        };

        const items = await TournamentItem.find(filter)
            .populate('organization', 'name username fullName logo email')
            .populate('tournamentId', 'name')
            .populate({
                path: 'categoryRule',
                populate: ['gameRule', 'scoringRule', 'timeManagementRule', 'resourceManagementRule', 'faultsAndPenaltiesRule']
            })
            .sort({ 'timeLine.registrationEnd': 1, createdAt: -1 })
            .lean();

        const decorated = await decorateTournamentItems(items);
        res.json({ data: decorated.filter((item) => !['completed', 'cancelled'].includes(item.status)) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getSingleSportTournamentsByOrganization = async (req, res) => {
    try {
        const currentUser = req.user._id;
        const user = await User.findById(currentUser).populate('roles');
        if (!user) return res.status(404).json({ message: "Người dùng không tồn tại" });
        const hasAdmin = user.roles.some(r => r.name === 'admin');

        let filter = { tournamentId: null, status: { $ne: 'cancelled' } };
        if (!hasAdmin) {
            filter.organization = currentUser;
        } else if (req.query.organizationId) {
            filter.organization = req.query.organizationId;
        }

        const { status, sportType } = req.query;
        if (status) filter.status = status;
        if (sportType) filter.sportType = sportType;

        const tournaments = await TournamentItem.find(filter)
            .populate('organization', 'name username fullName logo email')
            .populate({
                path: 'categoryRule',
                populate: ['gameRule', 'scoringRule', 'timeManagementRule', 'resourceManagementRule', 'faultsAndPenaltiesRule']
            })
            .sort({ createdAt: -1 })
            .lean();

        res.json({ data: await decorateTournamentItems(tournaments) });
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
        let filter = { status: { $ne: 'cancelled' } };
        if (!hasAdmin) {
            filter.organization = currentUser;
        } else if (req.query.organizationId) {
            filter.organization = req.query.organizationId;
        }
        const { status } = req.query;
        if (status) filter.status = status;
        const tournaments = await Tournament.find(filter)
            .populate('organization', 'name username fullName logo email')
            .populate('tournamnetItem')
            .sort({ createdAt: -1 })
            .lean();
        res.json({ data: await decorateTournamentWithItems(tournaments) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getTournamentById = async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id)
            .populate('organization', 'name username fullName logo email')
            .populate({
                path: 'tournamnetItem',
                populate: {
                    path: 'categoryRule',
                    populate: ['gameRule', 'scoringRule', 'timeManagementRule', 'resourceManagementRule', 'faultsAndPenaltiesRule']
                }
            })
            .lean();
        if (!tournament) return res.status(404).json({ message: "Không tìm thấy hội thao" });
        if (tournament.status === 'cancelled') {
            if (!req.user?._id) return res.status(403).json({ message: 'Tournament is cancelled' });
            const perm = await checkPermission(req.user._id, tournament.organization);
            if (!perm.allowed) return res.status(403).json({ message: perm.message });
        }
        res.json(await decorateTournamentWithItems(tournament));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getSingleTournamentById = async (req, res) => {
    try {
        const item = await TournamentItem.findById(req.params.id)
            .populate('organization', 'name username fullName logo email')
            .populate({
                path: 'categoryRule',
                populate: ['gameRule', 'scoringRule', 'timeManagementRule', 'resourceManagementRule', 'faultsAndPenaltiesRule']
            })
            .lean();
        if (!item) return res.status(404).json({ message: "Không tìm thấy giải đấu" });
        if (item.status === 'cancelled') {
            if (!req.user?._id) return res.status(403).json({ message: 'Tournament is cancelled' });
            const perm = await checkPermission(req.user._id, item.organization);
            if (!perm.allowed) return res.status(403).json({ message: perm.message });
        }
        // Trả về đầy đủ
        const decorated = await decorateTournamentItems(item);
        const result = {
            ...decorated,
            sportType: item.sportType || item.categoryRule?.sportType || '',
            description: item.description || '',
            registeredTeams: decorated.registeredTeams || 0,
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
    try {
        const userId = req.user._id;
        const data = req.body;
        // Kiểm tra quyền
        const perm = await checkPermission(userId, userId);
        if (!perm.allowed) return res.status(403).json({ message: perm.message });
        if (!perm.user.roles.some(r => ['org', 'organization', 'admin'].includes(r.name))) {
            return res.status(403).json({ message: 'Bạn cần có role org hoặc admin để tạo giải' });
        }

        // Validate timeline
        const timelineResult = buildTimeline(data);
        if (!timelineResult.success) {
            console.warn('CREATE SINGLE TIMELINE INVALID:', timelineResult.errors, {
                registrationStart: data.registrationStart,
                registrationEnd: data.registrationEnd,
                tournamentStart: data.tournamentStart,
                tournamentEnd: data.tournamentEnd
            });
            return res.status(400).json({ message: timelineResult.errors.join('; ') });
        }
        data.timeline = timelineResult.data;

        const item = await TournamentService.createSingleTournament(userId, data);
        res.status(201).json({ message: 'Tạo giải đấu thành công', data: item });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createMultiSportTournament = async (req, res) => {
    try {
        const userId = req.user._id;
        const data = req.body;
        const perm = await checkPermission(userId, userId);
        if (!perm.allowed) return res.status(403).json({ message: perm.message });
        if (!perm.user.roles.some(r => ['org', 'organization', 'admin'].includes(r.name))) {
            return res.status(403).json({ message: 'Bạn cần có role org hoặc admin để tạo hội thao' });
        }

        const timelineResult = buildTimeline(data);
        if (!timelineResult.success) {
            console.warn('CREATE MULTI TIMELINE INVALID:', timelineResult.errors, {
                registrationStart: data.registrationStart,
                registrationEnd: data.registrationEnd,
                tournamentStart: data.tournamentStart,
                tournamentEnd: data.tournamentEnd
            });
            return res.status(400).json({ message: timelineResult.errors.join('; ') });
        }
        data.timeline = timelineResult.data;

        const tournament = await TournamentService.createMultiTournament(userId, data);
        res.status(201).json({ message: 'Tạo hội thao thành công', data: tournament });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ========== UPDATE ==========
export const updateSingleSportTournament = async (req, res) => {
    try {
        const itemId = req.params.id;
        const userId = req.user._id;
        const updateData = req.body;

        const item = await TournamentItem.findById(itemId);
        if (!item) return res.status(404).json({ message: 'Không tìm thấy giải đấu' });
        const perm = await checkPermission(userId, item.organization);
        if (!perm.allowed) return res.status(403).json({ message: perm.message });

        // Nếu có timeline trong updateData, validate
        if (updateData.registrationStart || updateData.registrationEnd || updateData.tournamentStart || updateData.tournamentEnd) {
            const timelineResult = buildTimeline(updateData, { allowPast: true });
            if (!timelineResult.success) {
                return res.status(400).json({ message: timelineResult.errors.join('; ') });
            }
            updateData.timeLine = timelineResult.data;
        }

        const updated = await TournamentService.updateSingleTournament(itemId, userId, updateData);
        res.json({ message: 'Cập nhật giải đấu thành công', data: updated });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateMultiSportTournament = async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const userId = req.user._id;
        const updateData = req.body;

        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) return res.status(404).json({ message: 'Không tìm thấy hội thao' });
        const perm = await checkPermission(userId, tournament.organization);
        if (!perm.allowed) return res.status(403).json({ message: perm.message });

        if (updateData.registrationStart || updateData.registrationEnd || updateData.tournamentStart || updateData.tournamentEnd) {
            const timelineResult = buildTimeline(updateData, { allowPast: true });
            if (!timelineResult.success) {
                return res.status(400).json({ message: timelineResult.errors.join('; ') });
            }
            updateData.timeLine = timelineResult.data;
        }

        const updated = await TournamentService.updateMultiTournament(tournamentId, userId, updateData);
        res.json({ message: 'Cập nhật hội thao thành công', data: updated });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ========== DELETE (SOFT DELETE) ==========
export const softDeleteSingleTournament = async (req, res) => {
    try {
        const itemId = req.params.id;
        const userId = req.user._id;

        const item = await TournamentItem.findById(itemId);
        if (!item) return res.status(404).json({ message: 'Không tìm thấy giải đấu' });
        const perm = await checkPermission(userId, item.organization);
        if (!perm.allowed) return res.status(403).json({ message: perm.message });

        const result = await TournamentService.softDeleteSingle(itemId, userId);
        res.json({ message: 'Đã hủy giải đấu', data: result });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const softDeleteMultiTournament = async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const userId = req.user._id;

        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) return res.status(404).json({ message: 'Không tìm thấy hội thao' });
        const perm = await checkPermission(userId, tournament.organization);
        if (!perm.allowed) return res.status(403).json({ message: perm.message });

        const result = await TournamentService.softDeleteMulti(tournamentId, userId);
        res.json({ message: 'Đã hủy hội thao', data: result });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ========== CHANGE STATUS ==========
export const changeSingleStatus = async (req, res) => {
    try {
        const itemId = req.params.id;
        const userId = req.user._id;
        const { newStatus } = req.body;
        if (!newStatus) return res.status(400).json({ message: 'Thiếu newStatus' });

        const item = await TournamentItem.findById(itemId);
        if (!item) return res.status(404).json({ message: 'Không tìm thấy giải đấu' });
        const perm = await checkPermission(userId, item.organization);
        if (!perm.allowed) return res.status(403).json({ message: perm.message });

        const result = await TournamentService.changeSingleStatus(itemId, userId, newStatus);
        res.json({ message: `Đã chuyển trạng thái sang ${newStatus}`, data: result });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const changeMultiStatus = async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const userId = req.user._id;
        const { newStatus } = req.body;
        if (!newStatus) return res.status(400).json({ message: 'Thiếu newStatus' });

        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) return res.status(404).json({ message: 'Không tìm thấy hội thao' });
        const perm = await checkPermission(userId, tournament.organization);
        if (!perm.allowed) return res.status(403).json({ message: perm.message });

        const result = await TournamentService.changeMultiStatus(tournamentId, userId, newStatus);
        res.json({ message: `Đã chuyển trạng thái hội thao sang ${newStatus}`, data: result });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const exportSingleTournamentPdf = async (req, res) => {
    try {
        const itemId = req.params.id;
        const userId = req.user._id;

        const item = await TournamentItem.findById(itemId)
            .populate('organization', 'name username fullName logo email')
            .populate({
                path: 'categoryRule',
                populate: ['gameRule', 'scoringRule', 'timeManagementRule', 'resourceManagementRule', 'faultsAndPenaltiesRule']
            })
            .lean();
        if (!item) return res.status(404).json({ message: 'Không tìm thấy giải đấu' });

        const perm = await checkPermission(userId, item.organization?._id || item.organization);
        if (!perm.allowed) return res.status(403).json({ message: perm.message });

        const teams = await Participant.find({ tournamentItemId: itemId })
            .populate('lineup.Player', 'name gender birthDate skill')
            .lean();
        const buffer = await buildTournamentOverviewPdf({
            tournament: item,
            teams,
            exportedBy: req.user,
        });
        const date = new Date().toISOString().slice(0, 10);
        const fileName = `bao-cao-giai-${safePdfFileName(item.name || itemId)}-${date}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Không thể xuất PDF giải đấu' });
    }
};
