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

        const tournaments = await Tournament.find(filter)
            .populate('organizer', 'name')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Tournament.countDocuments(filter);

        return res.status(200).json({
            data: tournaments,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error("Lỗi trong getAllTournaments:", error);
        return res.status(500).json({ message: error.message });
    }
};

export const getTournamentByOrganization = async (req, res) => {
    const userId = req.user._id;
    try {
        const organization = await Organization.findOne({ ownerId: userId });
        if (!organization) {
            return res.status(404).json({ message: "Tổ chức không tồn tại" });
        }
        const tournaments = await Tournament.find({ organizer: organization._id }).populate('organizer', 'name');
        return res.status(200).json(tournaments);
    } catch (error) {
        console.error("Lỗi trong hàm getTournamentByOrganization:", error);
        return res.status(500).json({ message: error.message });
    }
};

export const getTournamentById = async (req, res) => {
    const { id } = req.params;
    try {
        const tournament = await Tournament.findById(id).populate('organizer', 'name').populate('baseRule');
        if (!tournament) {
            return res.status(404).json({ message: "Không tìm thấy giải đấu" });
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
        const { name, description, sportType, timeLine, location, logo, banner, budget, paymentQR, prize, galaConfig } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "không tìm thấy người dùng" });
        }
        const organization = await Organization.findOne({ ownerId: userId });
        if (!organization) {
            return res.status(404).json({ message: "Tổ chức không tồn tại" });
        }

        const tournament = new Tournament({
            name,
            description: description || '',
            sportType: Array.isArray(sportType) ? sportType : [sportType],
            banner: banner || '',
            logo: logo || '',
            timeLine: timeLine,
            location: location || { city: '', district: '' },
            prizes: prize || '',
            galaConfig: galaConfig || { hasGala: false },
            paymentQR: paymentQR || '',
            organizer: organization._id,
            budget: budget || { totalSponsor: 0, totalExpense: 0 },
            baseRule: [],
            status: 'upcoming'
        });

        const savedTournament = await tournament.save();
        res.status(201).json(savedTournament);
    } catch (error) {
        console.error("Lỗi trong hàm createTournament:", error);
        res.status(500).json({ message: error.message });
    }
};

export const updateTournament = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const { name, description, sportType, timeLine, location, logo, banner, budget, paymentQR, prize, galaConfig } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "không tìm thấy người dùng" });

        const organization = await Organization.findOne({ ownerId: userId });
        if (!organization) return res.status(404).json({ message: "Tổ chức không tồn tại" });

        const tournament = await Tournament.findById(id);
        if (!tournament) return res.status(404).json({ message: "Tournament not found" });
        if (tournament.organizer.toString() !== organization._id.toString()) {
            return res.status(403).json({ message: "Bạn không có quyền cập nhật giải đấu này" });
        }

        tournament.name = name || tournament.name;
        tournament.description = description || tournament.description;
        tournament.sportType = sportType || tournament.sportType;
        tournament.timeLine = timeLine || tournament.timeLine;
        tournament.location = location || tournament.location;
        tournament.prizes = prize || tournament.prizes;
        tournament.galaConfig = galaConfig || tournament.galaConfig;
        tournament.paymentQR = paymentQR || tournament.paymentQR;
        tournament.logo = logo || tournament.logo;
        tournament.banner = banner || tournament.banner;
        tournament.budget = budget || tournament.budget;

        const updatedTournament = await tournament.save();
        res.status(200).json(updatedTournament);
    } catch (error) {
        console.error("Lỗi trong hàm updateTournament:", error);
        res.status(500).json({ message: error.message });
    }
};

export const deleteTournament = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "không tìm thấy người dùng" });
        const organization = await Organization.findOne({ ownerId: userId });
        if (!organization) return res.status(404).json({ message: "Tổ chức không tồn tại" });

        const tournament = await Tournament.findById(id);
        if (!tournament) return res.status(404).json({ message: "Tournament not found" });
        if (tournament.organizer.toString() !== organization._id.toString()) {
            return res.status(403).json({ message: "Bạn không có quyền xóa giải đấu này" });
        }

        tournament.status = 'cancelled';
        await tournament.save();
        res.status(200).json({ message: "Tournament cancelled successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

export const getPlayerTournament = async (req, res) => {
    try {
        const userId = req.user._id;
        const { tournamentId, sport } = req.query;

        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) return res.status(404).json({ message: "Giải đấu không tồn tại" });

        const organization = await Organization.findOne({ ownerId: userId });
        if (!organization || tournament.organizer.toString() !== organization._id.toString()) {
            return res.status(403).json({ message: "Không có quyền xem player của giải này" });
        }

        const filter = {};
        if (tournamentId) filter.tournamentId = tournamentId;
        if (sport) filter['sports.category'] = sport; // tùy chỉnh

        const players = await Player.find(filter).populate('userId', 'username email').sort({ createdAt: -1 });

        return res.status(200).json({ message: 'Lấy dữ liệu thành công', data: players });
    } catch (error) {
        console.error("Lỗi trong getPlayerTournament:", error);
        res.status(500).json({ message: error.message });
    }
};