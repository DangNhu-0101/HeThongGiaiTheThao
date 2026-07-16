console.log('=== RULE ROUTE FILE LOADED ===');

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
    getAllCategoryRules,
    getCompetitionSports,
    updateCompetitionSportStatus,
    getTemplatesBySport,
    getCompetitionTemplateDetail
} from '../controllers/ruleController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ==================== TEMPLATE ROUTES ====================
router.get('/sports', getCompetitionSports);
router.patch('/sports/:sportType/status', protectedRoute('admin'), updateCompetitionSportStatus);
router.get('/competition-templates', protectedRoute('admin', 'org', 'organization', { profile: true }), getTemplatesBySport);
router.get('/competition-templates/:id', protectedRoute('admin', 'org', 'organization', { profile: true }), getCompetitionTemplateDetail);
router.get('/templates', getTemplates);
router.get('/templates/:id', getTemplateById);
router.get('/categories', getCategories);
router.get('/categories/:id', getCategoryById);
router.get('/categories/:categoryId/flatten', getFlattenRules);

// ==================== CATEGORY RULE ROUTES ====================
router.get('/category-rules', protectedRoute(), getAllCategoryRules);
router.get('/category-rules/:id', protectedRoute(), getCategoryRuleById);
// Trong ruleRoute.js, tạm thời thêm middleware log
router.post('/category-rules',
    (req, res, next) => { 
        console.log('=== POST /category-rules HIT ===');
        next(); 
    },
    protectedRoute('admin', 'org', 'organization', { profile: true }),
    createCategoryRule
);
router.put('/category-rules/:id', protectedRoute('admin', 'org', 'organization', { profile: true }), updateCategoryRule);
router.delete('/category-rules/:id', protectedRoute('admin', 'org', 'organization', { profile: true }), deleteCategoryRule);

export default router;
