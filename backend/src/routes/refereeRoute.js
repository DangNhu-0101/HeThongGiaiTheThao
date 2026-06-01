import express from 'express';
import bcrypt from 'bcrypt';
import Referee from '../models/referees.js';
import User from '../models/users.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/all', async (req, res) => {
    try {
        const refs = await Referee.find();
        res.json({ data: refs });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', protectedRoute('org, Organization'), async (req, res) => {
    try {
        const {
            name,
            phoneNumber,
            email,
            birthDate,
            gender = 'other',
            sports = []
        } = req.body;

        if (!name || !phoneNumber || !email) {
            return res.status(400).json({ success: false, message: 'Thiếu tên, số điện thoại hoặc email trọng tài' });
        }

        const existingUser = await User.findOne({ $or: [{ email }, { phoneNumber }] });
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'Email hoặc số điện thoại đã tồn tại' });
        }

        const usernameBase = email.split('@')[0] || phoneNumber;
        let username = usernameBase;
        let suffix = 1;
        while (await User.exists({ username })) {
            username = `${usernameBase}${suffix}`;
            suffix += 1;
        }

        const hashedPassword = await bcrypt.hash(phoneNumber, 10);
        const user = await User.create({
            username,
            email,
            phoneNumber,
            hashedPassword,
            role: 'referee',
            status: 'Active'
        });

        const referee = await Referee.create({
            userId: user._id,
            name,
            phoneNumber,
            birthDate: birthDate ? new Date(birthDate) : new Date('2000-01-01'),
            gender,
            sports: Array.isArray(sports) ? sports : []
        });

        return res.status(201).json({ success: true, data: referee });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

router.put('/:id', protectedRoute('org, Organization'), async (req, res) => {
    try {
        const { name, phoneNumber, sports } = req.body;
        const referee = await Referee.findById(req.params.id);
        if (!referee) return res.status(404).json({ success: false, message: 'Không tìm thấy trọng tài' });

        if (name !== undefined) referee.name = name;
        if (phoneNumber !== undefined) referee.phoneNumber = phoneNumber;
        if (Array.isArray(sports)) referee.sports = sports;

        await referee.save();
        return res.json({ success: true, data: referee });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

router.delete('/:id', protectedRoute('org, Organization'), async (req, res) => {
    try {
        const referee = await Referee.findByIdAndDelete(req.params.id);
        if (!referee) return res.status(404).json({ success: false, message: 'Không tìm thấy trọng tài' });
        return res.json({ success: true, data: { _id: req.params.id } });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

export default router;
