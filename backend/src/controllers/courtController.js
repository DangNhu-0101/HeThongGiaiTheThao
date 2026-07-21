import mongoose from "mongoose";
import Court from "../models/courts.js";
import TournamentItem from "../models/tournamentItem.js";

const statuses = ['empty', 'busy', 'maintenance', 'inactived'];
const cleanSports = (value) => Array.isArray(value)
    ? [...new Set(value.map(String).map(item => item.trim()).filter(Boolean))]
    : [];

export const getCourtsByTournamentItem = async (req, res) => {
    try {
        const { page = 1, limit = 100, status } = req.query;
        const filter = {};
        if (status) filter.status = status;
        let sportType = String(req.query.sportType || '').trim();
        if (!sportType && req.params.tournamentItemId && mongoose.Types.ObjectId.isValid(req.params.tournamentItemId)) {
            const item = await TournamentItem.findById(req.params.tournamentItemId).select('sportType').lean();
            sportType = String(item?.sportType || '').trim();
        }
        if (sportType) filter.sportTypes = { $regex: `^${sportType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' };
        const pageNumber = Math.max(1, Number(page) || 1);
        const limitNumber = Math.min(200, Math.max(1, Number(limit) || 100));
        const [courts, total] = await Promise.all([
            Court.find(filter).sort({ name: 1 }).skip((pageNumber - 1) * limitNumber).limit(limitNumber).lean(),
            Court.countDocuments(filter),
        ]);
        return res.json({ success: true, data: courts, pagination: { page: pageNumber, limit: limitNumber, total, totalPages: Math.ceil(total / limitNumber) } });
    } catch (error) {
        console.error('getCourts error:', error);
        return res.status(500).json({ success: false, message: 'Không thể tải danh sách sân' });
    }
};

export const getCourtById = async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.courtId)) return res.status(400).json({ success: false, message: 'ID sân không hợp lệ' });
    const court = await Court.findById(req.params.courtId).lean();
    return court ? res.json({ success: true, data: court }) : res.status(404).json({ success: false, message: 'Sân không tồn tại' });
};

export const addCourt = async (req, res) => {
    try {
        const name = String(req.body.name || '').trim();
        const location = String(req.body.location || '').trim();
        if (!name || !location) return res.status(400).json({ success: false, message: 'Vui lòng nhập tên sân và địa điểm' });
        const court = await Court.create({ name, location, sportTypes: cleanSports(req.body.sportTypes), status: statuses.includes(req.body.status) ? req.body.status : 'empty' });
        return res.status(201).json({ success: true, message: 'Thêm sân thành công', data: court });
    } catch (error) {
        if (error?.code === 11000) return res.status(409).json({ success: false, message: 'Sân này đã tồn tại tại địa điểm đã chọn' });
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateCourt = async (req, res) => {
    try {
        const updates = {};
        if (req.body.name !== undefined) updates.name = String(req.body.name).trim();
        if (req.body.location !== undefined) updates.location = String(req.body.location).trim();
        if (req.body.sportTypes !== undefined) updates.sportTypes = cleanSports(req.body.sportTypes);
        const court = await Court.findByIdAndUpdate(req.params.courtId, { $set: updates }, { returnDocument: 'after', runValidators: true });
        return court ? res.json({ success: true, message: 'Cập nhật sân thành công', data: court }) : res.status(404).json({ success: false, message: 'Sân không tồn tại' });
    } catch (error) {
        return res.status(error?.code === 11000 ? 409 : 500).json({ success: false, message: error?.code === 11000 ? 'Sân này đã tồn tại' : error.message });
    }
};

export const updateCourtStatus = async (req, res) => {
    if (!statuses.includes(req.body.status)) return res.status(400).json({ success: false, message: 'Trạng thái sân không hợp lệ' });
    const court = await Court.findByIdAndUpdate(req.params.courtId, { status: req.body.status }, { returnDocument: 'after' });
    return court ? res.json({ success: true, message: 'Cập nhật trạng thái sân thành công', data: court }) : res.status(404).json({ success: false, message: 'Sân không tồn tại' });
};

export const deleteCourt = async (req, res) => {
    const court = await Court.findByIdAndDelete(req.params.courtId);
    return court ? res.json({ success: true, message: 'Xóa sân thành công' }) : res.status(404).json({ success: false, message: 'Sân không tồn tại' });
};
