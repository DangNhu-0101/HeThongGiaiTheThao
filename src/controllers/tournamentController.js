import mongoose from 'mongoose';
import Tournament from '../models/tournaments.js';
import Organization from '../models/orgs.js';

const parseJson = (value, fallback) => {
    if (value === undefined || value === null || value === '') return fallback;
    if (typeof value !== 'string') return value;
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
};

const toDate = (value, fallback = new Date()) => value ? new Date(value) : fallback;

const getVenueText = (tournament) => {
    if (typeof tournament.location === 'string') return tournament.location;
    return [tournament.location?.city, tournament.location?.district].filter(Boolean).join(', ');
};

const normalizeTournament = (tournament) => {
    const raw = tournament.toObject ? tournament.toObject() : tournament;
    const sportType = raw.sportType || [];
    const sportsConfig = sportType.map((sport) => ({ sport }));
    const venue = getVenueText(raw);

    return {
        _id: raw._id,
        name: raw.name || raw.displayName,
        slogan: raw.slogan || '',
        targetAudience: raw.targetAudience || '',
        description: raw.description || '',
        venue,
        location: venue,
        status: raw.status,
        logo: raw.logo,
        banner: raw.banner,
        banners: raw.banner ? [raw.banner] : [],
        paymentQR: raw.paymentQR,
        prizes: raw.prizes || '',
        timeLine: {
            ...raw.timeLine,
            timeRegister: raw.timeLine?.timeRegister || raw.timeLine?.registrationStart,
            timeCloseRegister: raw.timeLine?.timeCloseRegister || raw.timeLine?.registrationEnd,
            timeOpen: raw.timeLine?.timeOpen || raw.timeLine?.tournamentStart,
            timeClose: raw.timeLine?.timeClose || raw.timeLine?.tournamentEnd,
            registrationStart: raw.timeLine?.registrationStart || raw.timeLine?.timeRegister,
            registrationEnd: raw.timeLine?.registrationEnd || raw.timeLine?.timeCloseRegister,
            tournamentStart: raw.timeLine?.tournamentStart || raw.timeLine?.timeOpen,
            tournamentEnd: raw.timeLine?.tournamentEnd || raw.timeLine?.timeClose,
        },
        sportType,
        sportsConfig,
        galaConfig: raw.galaConfig || {},
        organization: raw.organizer,
        organizer: raw.organizer,
        finance: {
            plannedRevenue: 0,
            actualRevenue: raw.budget?.totalSponsor || 0,
            totalExpense: raw.budget?.totalExpense || 0,
            balance: (raw.budget?.totalSponsor || 0) - (raw.budget?.totalExpense || 0)
        },
        budget: raw.budget || {},
        rules: raw.baseRule || [],
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt
    };
};

export const getAllTournament = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, sport } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (sport) filter.sportType = sport;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [tournaments, total] = await Promise.all([
            Tournament.find(filter)
                .populate('organizer', 'name orgName logoUrl')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Tournament.countDocuments(filter)
        ]);

        return res.status(200).json({
            success: true,
            message: 'Lấy danh sách giải đấu thành công',
            count: tournaments.length,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit),
            data: tournaments.map(normalizeTournament)
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const createTournament = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const currentUserId = req.user.id || req.user._id;
        const org = await Organization.findOne({ userId: currentUserId }).session(session);
        if (!org) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: 'Bạn không thuộc tổ chức nào, không thể tạo giải đấu' });
        }

        const sportsConfig = parseJson(req.body.sportsConfig, []);
        if (!sportsConfig.length) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Cần cung cấp ít nhất một môn thể thao.' });
        }

        const name = req.body.displayName || req.body.name;
        if (!name) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Tên giải đấu không được để trống.' });
        }

        const existing = await Tournament.findOne({ name }).session(session);
        if (existing) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: `Giải đấu '${name}' đã tồn tại.` });
        }

        const galaConfig = parseJson(req.body.galaConfig, {});
        const tournament = await Tournament.create([{
            name,
            description: req.body.description || '',
            prizes: req.body.prizes || '',
            logo: req.files?.logo?.[0]?.path || '',
            banner: req.files?.banners?.[0]?.path || req.files?.banner?.[0]?.path || '',
            paymentQR: req.files?.paymentQR?.[0]?.path || '',
            sportType: sportsConfig.map(s => s.sport).filter(Boolean),
            timeLine: {
                registrationStart: toDate(req.body.timeRegister),
                registrationEnd: toDate(req.body.timeCloseRegister),
                tournamentStart: toDate(req.body.timeOpen),
                tournamentEnd: toDate(req.body.timeClose),
            },
            galaConfig: {
                hasGala: !!galaConfig.hasGala,
                time: galaConfig.time ? new Date(galaConfig.time) : null,
                venue: galaConfig.venue || galaConfig.location || '',
                description: galaConfig.description || ''
            },
            location: { city: req.body.venue || '', district: '' },
            organizer: org._id,
            status: 'upcoming'
        }], { session });

        await Organization.findByIdAndUpdate(org._id, { $push: { tournaments: tournament[0]._id } }, { session });
        await session.commitTransaction();

        return res.status(201).json({
            success: true,
            message: `Tạo giải đấu ${name} thành công!`,
            data: { tournamentId: tournament[0]._id }
        });
    } catch (error) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

export const editTournament = async (req, res) => {
    try {
        const { id } = req.params;
        const tournament = await Tournament.findById(id);
        if (!tournament) return res.status(404).json({ success: false, message: 'Không tìm thấy giải đấu!' });

        const sportsConfig = parseJson(req.body.sportsConfig, null);
        const galaConfig = parseJson(req.body.galaConfig, null);

        if (req.body.displayName || req.body.name) tournament.name = req.body.displayName || req.body.name;
        if (req.body.description !== undefined) tournament.description = req.body.description;
        if (req.body.prizes !== undefined) tournament.prizes = req.body.prizes;
        if (sportsConfig) tournament.sportType = sportsConfig.map(s => s.sport).filter(Boolean);
        if (req.body.venue !== undefined) tournament.location = { city: req.body.venue, district: '' };
        if (galaConfig) {
            tournament.galaConfig = {
                hasGala: !!galaConfig.hasGala,
                time: galaConfig.time ? new Date(galaConfig.time) : null,
                venue: galaConfig.venue || galaConfig.location || '',
                description: galaConfig.description || ''
            };
        }

        if (req.body.timeRegister) tournament.timeLine.registrationStart = new Date(req.body.timeRegister);
        if (req.body.timeCloseRegister) tournament.timeLine.registrationEnd = new Date(req.body.timeCloseRegister);
        if (req.body.timeOpen) tournament.timeLine.tournamentStart = new Date(req.body.timeOpen);
        if (req.body.timeClose) tournament.timeLine.tournamentEnd = new Date(req.body.timeClose);

        if (req.files?.banners?.[0]) tournament.banner = req.files.banners[0].path;
        if (req.files?.banner?.[0]) tournament.banner = req.files.banner[0].path;
        if (req.files?.logo?.[0]) tournament.logo = req.files.logo[0].path;
        if (req.files?.paymentQR?.[0]) tournament.paymentQR = req.files.paymentQR[0].path;

        await tournament.save();
        return res.status(200).json({ success: true, message: 'Cập nhật giải đấu thành công!', data: normalizeTournament(tournament) });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getTournament = async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id)
            .populate('organizer', 'name orgName logoUrl')
            .lean();

        if (!tournament) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy giải đấu' });
        }

        return res.status(200).json({
            success: true,
            message: 'Lấy chi tiết giải đấu thành công',
            data: normalizeTournament(tournament)
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const cancelTournament = async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (!tournament) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy giải đấu' });
        }

        if (['completed', 'cancelled', 'playing'].includes(tournament.status)) {
            return res.status(400).json({ success: false, message: 'Giải đấu đã kết thúc, không thể hủy' });
        }

        tournament.status = 'cancelled';
        await tournament.save();

        return res.status(200).json({
            success: true,
            message: `Giải đấu ${tournament.name} đã bị hủy.`,
            data: { _id: tournament._id, status: tournament.status }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
