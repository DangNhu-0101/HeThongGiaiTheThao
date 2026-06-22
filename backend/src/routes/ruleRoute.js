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
    getAllCategoryRules,
    createCustomCategoryRule
} from '../controllers/ruleController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ==================== TEMPLATE ROUTES (LUẬT HỆ THỐNG) ====================
// Lấy danh sách tất cả templates (có filter sportType)
router.get('/templates', protectedRoute(), getTemplates);

// Lấy template theo id
router.get('/templates/:id', protectedRoute(), getTemplateById);

// Lấy danh sách category templates theo sportType
router.get('/categories', protectedRoute(), getCategories);

// Lấy category template theo id
router.get('/categories/:id', protectedRoute(), getCategoryById);

// Lấy flatten rules cho form (category template)
router.get('/categories/:categoryId/flatten', protectedRoute(), getFlattenRules);

// ==================== CATEGORY RULE ROUTES (LUẬT CỦA GIẢI) ====================
// Lấy danh sách CategoryRule (có filter sportType)
router.get('/category-rules', protectedRoute(), getAllCategoryRules);

// Lấy CategoryRule theo id
router.get('/category-rules/:id', protectedRoute(), getCategoryRuleById);

// Tạo CategoryRule từ category template (yêu cầu admin hoặc org)
router.post('/category-rules', protectedRoute('admin', 'org'), createCategoryRule);
router.post('/category-rules/custom', protectedRoute('admin', 'org'), createCustomCategoryRule);

// Cập nhật CategoryRule (yêu cầu admin hoặc org)
router.put('/category-rules/:id', protectedRoute('admin', 'org'), updateCategoryRule);

// Xóa CategoryRule (yêu cầu admin hoặc org)
router.delete('/category-rules/:id', protectedRoute('admin', 'org'), deleteCategoryRule);

export default router;
