import express from 'express';
import { protectedRoute } from '../middlewares/authMiddleware.js';
import {
    createNews,
    deleteNews,
    getNews,
    getRelatedNews,
    listAdminNews,
    listNews,
    listNewsTopics,
    updateNews,
} from '../controllers/newsController.js';

const router = express.Router();

router.get('/', listNews);
router.get('/topics/all', listNewsTopics);
router.get('/admin/all', protectedRoute('admin'), listAdminNews);
router.get('/:slug/related', getRelatedNews);
router.get('/:idOrSlug', getNews);
router.post('/', protectedRoute('admin'), createNews);
router.put('/:id', protectedRoute('admin'), updateNews);
router.delete('/:id', protectedRoute('admin'), deleteNews);

export default router;
