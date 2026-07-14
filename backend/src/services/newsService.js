import News from '../models/news.js';

const stripHtml = (value = '') => String(value)
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const slugifyNews = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || `tin-tuc-${Date.now()}`;

export const uniqueNewsSlug = async (title, currentId) => {
    const base = slugifyNews(title);
    let slug = base;
    let index = 2;
    while (await News.exists({ slug, ...(currentId ? { _id: { $ne: currentId } } : {}) })) {
        slug = `${base}-${index}`;
        index += 1;
    }
    return slug;
};

export const validateNewsPayload = (payload = {}, { partial = false } = {}) => {
    const errors = [];
    const title = typeof payload.title === 'string' ? payload.title.trim() : '';
    const topic = typeof payload.topic === 'string' ? payload.topic.trim() : '';
    const content = typeof payload.content === 'string' ? payload.content.trim() : '';

    if (!partial || payload.title !== undefined) {
        if (title.length < 3) errors.push('Tiêu đề phải có ít nhất 3 ký tự.');
    }
    if (!partial || payload.topic !== undefined) {
        if (topic.length < 2) errors.push('Chủ đề phải có ít nhất 2 ký tự.');
    }
    if (!partial || payload.content !== undefined) {
        if (stripHtml(content).length < 10) errors.push('Nội dung bài viết phải có ít nhất 10 ký tự.');
    }
    if (payload.status !== undefined && !['draft', 'published', 'archived'].includes(payload.status)) {
        errors.push('Trạng thái tin tức không hợp lệ.');
    }

    if (errors.length > 0) {
        const error = new Error(errors.join(' '));
        error.status = 400;
        throw error;
    }
};

export const buildNewsFilter = ({ status = 'published', topic, category, search } = {}, allowAll = false) => {
    const filter = {};
    if (allowAll && status === 'all') {
        // Admin can see all statuses.
    } else {
        filter.status = status || 'published';
    }
    if (topic) filter.topic = topic;
    if (category) filter.category = category;
    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: 'i' } },
            { excerpt: { $regex: search, $options: 'i' } },
            { topic: { $regex: search, $options: 'i' } },
        ];
    }
    return filter;
};
