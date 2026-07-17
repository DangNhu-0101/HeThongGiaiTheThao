import News from '../models/news.js';
import { buildNewsFilter, uniqueNewsSlug, validateNewsPayload } from '../services/newsService.js';

const canManageNews = (user) => {
    const roles = Array.isArray(user?.roles) ? user.roles : [];
    return roles.some((role) => {
        const name = typeof role === 'string' ? role : role?.name;
        return name === 'admin';
    });
};

const readPagination = (query) => {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    return { page, limit };
};

const listNewsByScope = async (req, res, allowAll = false) => {
    try {
        const { page, limit } = readPagination(req.query);
        const filter = buildNewsFilter(req.query, allowAll);
        const [data, total] = await Promise.all([
            News.find(filter)
                .populate('author', 'username email avatar')
                .sort({ publishedAt: -1, createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            News.countDocuments(filter),
        ]);
        return res.json({ success: true, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const listNews = (req, res) => listNewsByScope(req, res, false);

export const listAdminNews = (req, res) => {
    const adminQuery = { ...req.query, status: req.query.status || 'all' };
    return listNewsByScope({ ...req, query: adminQuery }, res, canManageNews(req.user));
};

export const getNews = async (req, res) => {
    try {
        const query = req.params.idOrSlug.match(/^[0-9a-fA-F]{24}$/)
            ? { _id: req.params.idOrSlug }
            : { slug: req.params.idOrSlug };
        const allowDraft = canManageNews(req.user);
        const item = await News.findOne({ ...query, ...(allowDraft ? {} : { status: 'published' }) })
            .populate('author', 'username email avatar')
            .lean();
        if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy tin tức.' });
        return res.json({ success: true, data: item });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getRelatedNews = async (req, res) => {
    try {
        const current = await News.findOne({ slug: req.params.slug, status: 'published' }).lean();
        if (!current) return res.status(404).json({ success: false, message: 'Không tìm thấy tin tức.' });
        const limit = Math.min(12, Math.max(1, Number(req.query.limit) || 8));
        const data = await News.find({
            _id: { $ne: current._id },
            status: 'published',
            topic: current.topic,
        })
            .sort({ publishedAt: -1, createdAt: -1 })
            .limit(limit)
            .lean();
        return res.json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const listNewsTopics = async (_req, res) => {
    try {
        const topics = await News.distinct('topic', { topic: { $ne: '' } });
        return res.json({ success: true, data: topics.sort((a, b) => a.localeCompare(b, 'vi')) });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const createNews = async (req, res) => {
    try {
        validateNewsPayload(req.body);
        const payload = req.body || {};
        const topic = String(payload.topic || payload.category || 'Tin tức').trim();
        const slug = await uniqueNewsSlug(payload.slug || payload.title);
        const item = await News.create({
            title: String(payload.title).trim(),
            slug,
            excerpt: payload.excerpt || '',
            content: payload.content || '',
            coverImage: payload.coverImage || '',
            category: payload.category || topic,
            topic,
            status: payload.status || 'published',
            author: req.user?._id || null,
            publishedAt: payload.publishedAt || new Date(),
        });
        return res.status(201).json({ success: true, data: item });
    } catch (error) {
        return res.status(error.status || 400).json({ success: false, message: error.message });
    }
};

export const updateNews = async (req, res) => {
    try {
        validateNewsPayload(req.body, { partial: true });
        const payload = req.body || {};
        const update = {
            title: payload.title?.trim(),
            excerpt: payload.excerpt,
            content: payload.content,
            coverImage: payload.coverImage,
            category: payload.category,
            topic: payload.topic,
            status: payload.status,
            publishedAt: payload.publishedAt,
        };
        Object.keys(update).forEach((key) => update[key] === undefined && delete update[key]);
        if (payload.slug || payload.title) update.slug = await uniqueNewsSlug(payload.slug || payload.title, req.params.id);
        const item = await News.findByIdAndUpdate(req.params.id, update, { returnDocument: 'after', runValidators: true });
        if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy tin tức.' });
        return res.json({ success: true, data: item });
    } catch (error) {
        return res.status(error.status || 400).json({ success: false, message: error.message });
    }
};

export const deleteNews = async (req, res) => {
    try {
        const item = await News.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy tin tức.' });
        return res.json({ success: true, data: item });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
