// routes/ruleRoutes.js
import express from 'express';
import {
    getTemplates,
    getTemplateById,
    getCategories,
    getCategoryById,
    getFlattenRules,
    createCategoryRule,
    getCategoryRuleById,
    updateCategoryRule,
    deleteCategoryRule,
    getAllCategoryRules
} from '../controllers/ruleController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ==================== TEMPLATE ROUTES ====================
router.get('/templates', protectedRoute(), getTemplates);
router.get('/templates/:id', protectedRoute(), getTemplateById);
router.get('/categories', protectedRoute(), getCategories);
router.get('/categories/:id', protectedRoute(), getCategoryById);
router.get('/categories/:categoryId/flatten', protectedRoute(), getFlattenRules);

// ==================== CATEGORY RULE ROUTES ====================
router.get('/category-rules', protectedRoute(), getAllCategoryRules);
router.get('/category-rules/:id', protectedRoute(), getCategoryRuleById);
router.post('/category-rules', protectedRoute('admin', 'org', { profile: true }), createCategoryRule);
router.put('/category-rules/:id', protectedRoute('admin', 'org', { profile: true }), updateCategoryRule);
router.delete('/category-rules/:id', protectedRoute('admin', 'org', { profile: true }), deleteCategoryRule);

export default router;