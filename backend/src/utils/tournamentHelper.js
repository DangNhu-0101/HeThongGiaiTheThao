// utils/tournamentHelper.js
import mongoose from 'mongoose';
import User from '../models/users.js';
import TournamentItem from '../models/tournamentItem.js';
import Tournament from '../models/tournaments.js';
import CategoryRule from '../models/rules/categories.js';
import Organization from '../models/orgs.js';

// ==================== PERMISSION ====================

/**
 * Kiểm tra quyền chung: user có phải admin hoặc owner của ownerId
 * @param {string} userId - ID của user cần kiểm tra
 * @param {string} ownerId - ID của người sở hữu đối tượng (thường là userId)
 * @returns {Object} { allowed, message, user, isAdmin, isOwner }
 */
export const checkPermission = async (userId, ownerId) => {
    if (!userId) {
        return { allowed: false, message: 'User not found', user: null, isAdmin: false, isOwner: false };
    }
    const user = await User.findById(userId).populate('roles');
    if (!user) {
        return { allowed: false, message: 'User not found', user: null, isAdmin: false, isOwner: false };
    }
    const roles = Array.isArray(user.roles) ? user.roles : [];
    const isAdmin = roles.some(r => r.name === 'admin');
    const ownerValue = ownerId?._id || ownerId;
    let isOwner = ownerValue && ownerValue.toString() === userId.toString();
    if (!isOwner && ownerValue && mongoose.Types.ObjectId.isValid(ownerValue)) {
        const orgProfile = await Organization.findById(ownerValue).select('ownerId').lean();
        isOwner = Boolean(orgProfile?.ownerId && orgProfile.ownerId.toString() === userId.toString());
    }
    if (!isAdmin && !isOwner) {
        return { allowed: false, message: 'You do not have permission to perform this action', user, isAdmin, isOwner };
    }
    return { allowed: true, user, isAdmin, isOwner };
};

/**
 * Kiểm tra quyền trên tournament item (dùng checkPermission)
 * @param {string} tournamentItemId
 * @param {string} userId
 * @returns {Object} { allowed, message, item, user, isAdmin, isOwner }
 */
export const checkTournamentItemPermission = async (tournamentItemId, userId) => {
    if (!tournamentItemId || !mongoose.Types.ObjectId.isValid(tournamentItemId)) {
        return { allowed: false, message: 'Invalid tournament item id', item: null, user: null, isAdmin: false, isOwner: false };
    }
    const item = await TournamentItem.findById(tournamentItemId);
    if (!item) {
        return { allowed: false, message: 'Tournament item not found', item: null, user: null, isAdmin: false, isOwner: false };
    }
    const directPerm = await checkPermission(userId, item.organization);
    if (directPerm.allowed) return { ...directPerm, item };

    if (item.tournamentId && mongoose.Types.ObjectId.isValid(item.tournamentId)) {
        const parentTournament = await Tournament.findById(item.tournamentId).select('organization').lean();
        if (parentTournament?.organization) {
            const parentPerm = await checkPermission(userId, parentTournament.organization);
            if (parentPerm.allowed) return { ...parentPerm, item };
        }
    }

    return { ...directPerm, item };
};

/**
 * Kiểm tra trạng thái tournament có cho phép sửa match không
 * @param {string} tournamentItemId
 * @param {Array} userRoles - mảng role object (có field name)
 * @returns {Object} { valid, message, item }
 */
export const checkTournamentItemStatusForMatch = async (tournamentItemId, userRoles) => {
    const item = await TournamentItem.findById(tournamentItemId);
    if (!item) {
        return { valid: false, message: 'Tournament item not found', item: null };
    }
    const hasAdmin = userRoles.some(r => r.name === 'admin');
    if (item.status === 'completed' || item.status === 'cancelled') {
        return { valid: false, message: 'Cannot modify match of a completed or cancelled tournament', item };
    }
    if (item.status === 'playing' && !hasAdmin) {
        return { valid: false, message: 'Only admin can modify matches while tournament is in progress', item };
    }
    return { valid: true, item };
};

// ==================== CATEGORY RULE ====================

/**
 * Giải phóng categoryRule (set tournamentItemId = null)
 * @param {string} categoryRuleId
 * @param {Object} session - mongoose session (optional)
 * @returns {Promise<void>}
 */
export const releaseCategoryRule = async (categoryRuleId, session = null) => {
    if (!categoryRuleId) return;
    const rule = await CategoryRule.findById(categoryRuleId).session(session || null);
    if (rule) {
        rule.tournamentItemId = null;
        await rule.save({ session: session || null });
    }
};

/**
 * Giải phóng nhìều categoryRule
 * @param {string[]} categoryRuleIds
 * @param {Object} session
 */
export const releaseCategoryRules = async (categoryRuleIds, session = null) => {
    if (!categoryRuleIds || categoryRuleIds.length === 0) return;
    for (const id of categoryRuleIds) {
        await releaseCategoryRule(id, session);
    }
};

// ==================== TIMELINE ====================

/**
 * Validate timeline (không throw error)
 * @param {string|Date} registrationStart
 * @param {string|Date} registrationEnd
 * @param {string|Date} tournamentStart
 * @param {string|Date} tournamentEnd
 * @returns {Object} { success, data, errors }
 */
export const validateTimeline = (registrationStart, registrationEnd, tournamentStart, tournamentEnd, options = {}) => {
    const errors = [];
    const now = new Date();
    const allowedClockSkewMs = 5 * 60 * 1000;
    const allowPast = Boolean(options.allowPast);
    const regStart = new Date(registrationStart);
    const regEnd = new Date(registrationEnd);
    const tourStart = new Date(tournamentStart);
    const tourEnd = new Date(tournamentEnd);

    if (isNaN(regStart) || isNaN(regEnd) || isNaN(tourStart) || isNaN(tourEnd)) {
        return { success: false, data: null, errors: ['Invalid date format'] };
    }
    if (regStart >= regEnd) {
        errors.push('Registration start must be before registration end');
    }
    if (regEnd >= tourStart) {
        errors.push('Registration end must be before tournament start');
    }
    if (tourStart >= tourEnd) {
        errors.push('Tournament start must be before tournament end');
    }
    if (!allowPast && regStart.getTime() + allowedClockSkewMs < now.getTime()) {
        errors.push('Registration start must be in the future');
    }
    if (errors.length) {
        return { success: false, data: null, errors };
    }
    return {
        success: true,
        data: {
            registrationStart: regStart,
            registrationEnd: regEnd,
            tournamentStart: tourStart,
            tournamentEnd: tourEnd
        },
        errors: []
    };
};

/**
 * Build timeline từ body request (dùng validateTimeline)
 * @param {Object} body - chứa registrationStart, registrationEnd, tournamentStart, tournamentEnd
 * @returns {Object} { success, data, errors }
 */
export const buildTimeline = (body, options = {}) => {
    return validateTimeline(
        body.registrationStart,
        body.registrationEnd,
        body.tournamentStart,
        body.tournamentEnd,
        options
    );
};

// ==================== STATUS TRANSITION ====================

/**
 * Kiểm tra chuyển trạng thái hợp lệ
 * @param {string} current - trạng thái hiện tại
 * @param {string} target - trạng thái muốn chuyển
 * @returns {boolean}
 */
export const isValidStatusTransition = (current, target) => {
    const transitions = {
        'upcoming': ['actived', 'cancelled'],
        'actived': ['playing', 'cancelled'],
        'playing': ['completed'],
        'completed': [],
        'cancelled': []
    };
    return transitions[current] && transitions[current].includes(target);
};
