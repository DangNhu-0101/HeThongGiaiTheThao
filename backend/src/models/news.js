import mongoose from 'mongoose';

const newsSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 220 },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    excerpt: { type: String, trim: true, default: '', maxlength: 500 },
    content: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    category: { type: String, trim: true, default: 'Tin tức' },
    topic: { type: String, trim: true, default: 'Tin tức', index: true },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'published',
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    publishedAt: { type: Date, default: Date.now },
}, { timestamps: true });

newsSchema.index({ title: 'text', excerpt: 'text', content: 'text', topic: 'text' });

const News = mongoose.model('News', newsSchema);
export default News;
