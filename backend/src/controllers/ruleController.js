import mongoose from 'mongoose';
import RuleService from '../services/RuleService.js';
import CategoryRuleService from '../services/categoryRuleSevice.js';

// lấy tất cả luật system
export const getTemplates = async (req, res) => {
    try {
        const { sportType } = req.query;
        const templates = await RuleService.getAllTemplates({ sportType });
        res.json({ success: true, data: templates });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

//lấy theo system ID
export const getTemplateById = async (req, res) => {
    try {
        const { id } = req.params;
        const template = await RuleService.getTemplateById(id);
        res.json({ success: true, data: template });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};

//lấy theo categori(don doi,...)
export const getCategories = async (req, res) => {
    try {
        const { sportType } = req.query;
        if (!sportType) throw new Error('Missing sportType');
        const categories = await RuleService.getCategoriesBySport(sportType);
        res.json({ success: true, data: categories });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

//lây category theo id
export const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await RuleService.getCategoryById(id);
        res.json({ success: true, data: category });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};

export const getFlattenRules = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const formData = await RuleService.getFlattenRulesForCategory(categoryId);
        res.json({ success: true, data: formData });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};




export const createCategoryRule = async (req, res) => {
    try {
        const { categoryTemplateId, editedRules, sportType, tournamentItemId } = req.body;
        
        if (!categoryTemplateId || !sportType) {
            throw new Error('Missing required fields: categoryTemplateId, sportType');
        }

        const categoryRule = await CategoryRuleService.createFromTemplate(
            categoryTemplateId,
            editedRules,
            sportType,
            tournamentItemId || null,
            null
        );

        res.status(201).json({ success: true, data: categoryRule });
    } catch (error) {
        console.error('CREATE RULE ERROR:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};


export const getCategoryRuleById = async (req, res) => {
    try {
        const { id } = req.params;
        const categoryRule = await CategoryRuleService.getById(id);
        res.json({ success: true, data: categoryRule });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};

export const updateCategoryRule = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        const updateData = req.body;
        const updated = await CategoryRuleService.update(id, updateData, session);
        await session.commitTransaction();
        res.json({ success: true, data: updated });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

export const deleteCategoryRule = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        await CategoryRuleService.delete(id, session);
        await session.commitTransaction();
        res.json({ success: true, message: 'CategoryRule deleted' });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

export const getAllCategoryRules = async (req, res) => {
    try {
        const { sportType } = req.query;
        const list = await CategoryRuleService.getAll({ sportType });
        res.json({ success: true, data: list });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};



