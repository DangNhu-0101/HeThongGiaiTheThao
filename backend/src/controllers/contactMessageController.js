import ContactMessage from '../models/contactMessages.js';

const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());

const mapMessage = (item) => ({
    id: item._id.toString(),
    fullName: item.fullName,
    email: item.email,
    phoneNumber: item.phoneNumber || '',
    subject: item.subject,
    content: item.content,
    attachments: item.attachments || [],
    isRead: Boolean(item.isRead),
    readAt: item.readAt,
    repliedAt: item.repliedAt,
    createdAt: item.createdAt
});

export const createContactMessage = async (req, res) => {
    try {
        const { fullName, email, phoneNumber, subject, content, attachments = [] } = req.body;
        if (!String(fullName || '').trim() || !isEmail(email) || !String(subject || '').trim() || !String(content || '').trim()) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ họ tên, email, tiêu đề và nội dung hợp lệ' });
        }

        const recentCount = await ContactMessage.countDocuments({
            email: String(email).trim().toLowerCase(),
            createdAt: { $gt: new Date(Date.now() - 10 * 60 * 1000) },
            deletedAt: null
        });
        if (recentCount >= 5) {
            return res.status(429).json({ success: false, message: 'Bạn gửi quá nhanh. Vui lòng thử lại sau ít phút.' });
        }

        const safeAttachments = Array.isArray(attachments) ? attachments.slice(0, 5).map((item) => ({
            url: String(item.url || '').trim(),
            path: String(item.path || '').trim(),
            name: String(item.name || '').trim().slice(0, 180),
            mimeType: String(item.mimeType || '').trim(),
            size: Number(item.size || 0)
        })).filter((item) => item.url && (!item.mimeType || allowedImageTypes.has(item.mimeType)) && item.size <= 5 * 1024 * 1024) : [];

        const message = await ContactMessage.create({
            fullName: String(fullName).trim(),
            email: String(email).trim().toLowerCase(),
            phoneNumber: String(phoneNumber || '').trim(),
            subject: String(subject).trim(),
            content: String(content).trim(),
            attachments: safeAttachments,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'] || ''
        });

        return res.status(201).json({ success: true, message: 'Đã gửi tin nhắn liên hệ', data: mapMessage(message) });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const listContactMessages = async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page || 1));
        const limit = Math.min(50, Math.max(5, Number(req.query.limit || 10)));
        const search = String(req.query.search || '').trim();
        const read = String(req.query.read || '').trim();
        const query = { deletedAt: null };
        if (read === 'true') query.isRead = true;
        if (read === 'false') query.isRead = false;
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }

        const [items, total] = await Promise.all([
            ContactMessage.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
            ContactMessage.countDocuments(query)
        ]);

        return res.json({ success: true, data: items.map(mapMessage), page, limit, total, totalPages: Math.ceil(total / limit) });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateContactMessageStatus = async (req, res) => {
    try {
        const update = {};
        if (req.body.isRead !== undefined) {
            update.isRead = Boolean(req.body.isRead);
            update.readAt = update.isRead ? new Date() : null;
        }
        if (req.body.repliedAt !== undefined) {
            update.repliedAt = req.body.repliedAt ? new Date(req.body.repliedAt) : new Date();
        }
        const message = await ContactMessage.findOneAndUpdate(
            { _id: req.params.id, deletedAt: null },
            { $set: update },
            { new: true }
        ).lean();
        if (!message) return res.status(404).json({ success: false, message: 'Không tìm thấy tin nhắn' });
        return res.json({ success: true, data: mapMessage(message) });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteContactMessage = async (req, res) => {
    try {
        const message = await ContactMessage.findOneAndUpdate(
            { _id: req.params.id, deletedAt: null },
            { $set: { deletedAt: new Date() } },
            { new: true }
        );
        if (!message) return res.status(404).json({ success: false, message: 'Không tìm thấy tin nhắn' });
        return res.json({ success: true, message: 'Đã xóa tin nhắn liên hệ' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
