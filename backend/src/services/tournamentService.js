// services/tournamentService.js
import mongoose from 'mongoose';
import Tournament from '../models/tournaments.js';
import TournamentItem from '../models/tournamentItem.js';
import CategoryRule from '../models/rules/categories.js';
import { releaseCategoryRules, buildTimeline, isValidStatusTransition } from '../utils/tournamentHelper.js';

const normalizeGalaConfig = (config = {}) => ({
    hasGala: Boolean(config.hasGala),
    time: config.time || config.start || config.galaStart || null,
    start: config.start || config.galaStart || config.time || null,
    end: config.end || config.galaEnd || null,
    venue: config.venue || config.galaVenue || '',
    description: config.description || config.galaDescription || ''
});

const normalizeRegistrationConfig = (config = {}, operations = {}) => {
    const mode = config.mode || operations.registrationMode || 'system';
    return {
        mode: mode === 'external' ? 'external' : 'system',
        formUrl: config.formUrl || config.registrationFormUrl || operations.registrationFormUrl || '',
        zaloGroupUrl: config.zaloGroupUrl || operations.zaloGroupUrl || '',
        maxRegistrations: Number(config.maxRegistrations ?? operations.maxRegistrations ?? 0),
        instructions: config.instructions || config.registrationInstructions || operations.registrationInstructions || '',
        supportContacts: config.supportContacts || operations.supportContacts || ''
    };
};

const normalizePaymentConfig = (config = {}, operations = {}) => ({
    feeIncludes: config.feeIncludes ?? (operations.feeIncludes ? operations.feeIncludes.split(',').map(item => item.trim()).filter(Boolean) : []),
    bankName: config.bankName || operations.bankName || '',
    accountName: config.accountName || operations.accountName || '',
    accountNumber: config.accountNumber || operations.accountNumber || '',
    transferContent: config.transferContent || operations.transferContent || '',
    instructions: config.instructions || config.paymentInstructions || operations.paymentInstructions || '',
    refundPolicy: config.refundPolicy || operations.refundPolicy || ''
});

const normalizeMediaConfig = (config = {}, operations = {}, fallback = {}) => {
    const bannerUrls = Array.isArray(config.bannerUrls)
        ? config.bannerUrls
        : Array.isArray(config.bannerUrl)
            ? config.bannerUrl
            : Array.isArray(operations.banner)
                ? operations.banner
                : fallback.banner
                    ? [fallback.banner]
                    : [];
    return {
        consent: Boolean(config.consent ?? config.mediaConsent ?? operations.mediaConsent),
        usageTerms: config.usageTerms || config.mediaUsageTerms || operations.mediaUsageTerms || '',
        logoUrl: config.logoUrl || operations.logo || fallback.logo || '',
        bannerUrls,
        paymentQRUrl: config.paymentQRUrl || operations.paymentQR || fallback.paymentQR || ''
    };
};

const normalizeSponsorshipConfig = (config = {}, operations = {}) => ({
    contact: config.contact || operations.sponsorContact || '',
    tiers: Array.isArray(config.tiers) ? config.tiers : Array.isArray(operations.sponsorTiers) ? operations.sponsorTiers : []
});

class TournamentService {
    // === CREATE SINGLE ===
    static async createSingleTournament(userId, data) {
        try {
            const {
                name, description, categoryRuleId,
                location, banner, logo, prizes, galaConfig, paymentQR,
                sportType, maxTeams, format, feeEntry, sponsorshipConfig,
                registrationConfig, paymentConfig, mediaConfig
            } = data;

            if (!categoryRuleId) throw new Error('Thiếu categoryRuleId');

            // Lấy categoryRule
            const categoryRule = await CategoryRule.findById(categoryRuleId);
            if (!categoryRule) throw new Error('CategoryRule không tồn tại');

            // Tạo timeline
            const timelineResult = buildTimeline(data);
            if (!timelineResult.success) {
                throw new Error(timelineResult.errors.join('; '));
            }
            const timeline = timelineResult.data;

            // Tạo TournamentItem
            const item = new TournamentItem({
                tournamentId: null,
                organization: userId,
                categoryRule: categoryRule._id,
                name: name || categoryRule.name,
                description: description || '',
                banner: banner || '',
                logo: logo || '',
                timeLine: timeline,
                feeEntry: feeEntry || 0,
                paymentQR: paymentQR || '',
                registrationConfig: normalizeRegistrationConfig(registrationConfig),
                paymentConfig: normalizePaymentConfig(paymentConfig),
                mediaConfig: normalizeMediaConfig(mediaConfig, {}, { logo, banner, paymentQR }),
                prizes: prizes || '',
                location: {
                    city: location?.city || '',
                    district: location?.district || '',
                    detail: location?.detail || ''
                },
                galaConfig: normalizeGalaConfig(galaConfig),
                sponsors: [],
                sponsorshipConfig: normalizeSponsorshipConfig(sponsorshipConfig),
                status: 'upcoming',
                sportType: sportType || categoryRule.sportType || '',
                maxTeams: maxTeams || 0,
                format: format || '',
                registeredTeams: 0
            });
            await item.save();


            return item;
        } catch (error) {
            throw error;
        }
    }

    // === CREATE MULTI ===
    static async createMultiTournament(userId, data) {
        try {
            const {
                name, description, categoryRuleIds,
                location, banner, logo, prizes, galaConfig, paymentQR, sportRules = [], sponsorshipConfig
            } = data;

            if (!categoryRuleIds || !Array.isArray(categoryRuleIds) || categoryRuleIds.length === 0) {
                throw new Error('Cần cung cấp danh sách categoryRuleIds');
            }

            // Kiểm tra categoryRules
            const categoryRules = await CategoryRule.find({ _id: { $in: categoryRuleIds } });
            if (categoryRules.length !== categoryRuleIds.length) throw new Error('Một số categoryRule không tồn tại');

            const ruleByCategoryRuleId = new Map(
                sportRules
                    .filter(rule => rule?.categoryRuleId)
                    .map(rule => [rule.categoryRuleId.toString(), rule])
            );

            const timelineResult = buildTimeline(data);
            if (!timelineResult.success) {
                throw new Error(timelineResult.errors.join('; '));
            }
            const timeline = timelineResult.data;

            // Tạo Tournament
            const tournament = new Tournament({
                name,
                description: description || '',
                logo: logo || '',
                banner: banner || '',
                startDate: timeline.tournamentStart,
                endDate: timeline.tournamentEnd,
                location: {
                    city: location?.city || '',
                    district: location?.district || '',
                    detail: location?.detail || ''
                },
                organization: userId,
                numberOfSport: categoryRuleIds.length,
                status: 'upcoming',
                tournamnetItem: []
            });
            await tournament.save();

            // Tạo TournamentItem cho mỗi categoryRule
            const itemIds = [];
            for (const categoryRule of categoryRules) {
                const itemConfig = ruleByCategoryRuleId.get(categoryRule._id.toString()) || {};
                const itemTimelineResult = itemConfig.registrationStart
                    ? buildTimeline(itemConfig)
                    : { success: true, data: timeline };
                if (!itemTimelineResult.success) {
                    throw new Error(itemTimelineResult.errors.join('; '));
                }
                const itemBanner = Array.isArray(itemConfig.itemBanners)
                    ? itemConfig.itemBanners[0]
                    : itemConfig.operations?.banner?.[0];
                const itemLogo = itemConfig.itemLogo || itemConfig.operations?.logo || logo || '';
                const itemPaymentQR = itemConfig.operations?.paymentQR || paymentQR || '';
                const itemMediaConfig = normalizeMediaConfig(
                    itemConfig.mediaConfig,
                    itemConfig.operations,
                    { logo: itemLogo, banner: itemBanner || banner || '', paymentQR: itemPaymentQR }
                );
                const item = new TournamentItem({
                    tournamentId: tournament._id,
                    organization: userId,
                    categoryRule: categoryRule._id,
                    name: itemConfig.itemName || categoryRule.name,
                    description: itemConfig.itemDescription || '',
                    banner: itemBanner || banner || '',
                    logo: itemLogo,
                    timeLine: itemTimelineResult.data,
                    feeEntry: itemConfig.feePerAthlete || 0,
                    paymentQR: itemPaymentQR,
                    registrationConfig: normalizeRegistrationConfig(itemConfig.registrationConfig, itemConfig.operations),
                    paymentConfig: normalizePaymentConfig(itemConfig.paymentConfig, itemConfig.operations),
                    mediaConfig: itemMediaConfig,
                    prizes: itemConfig.prizes || prizes || '',
                    location: {
                        city: location?.city || '',
                        district: location?.district || '',
                        detail: itemConfig.location || location?.detail || ''
                    },
                    galaConfig: normalizeGalaConfig(itemConfig.galaConfig || itemConfig.operations || galaConfig),
                    sponsors: [],
                    sponsorshipConfig: normalizeSponsorshipConfig(itemConfig.sponsorshipConfig || sponsorshipConfig, itemConfig.operations),
                    status: 'upcoming',
                    sportType: itemConfig.sport || categoryRule.sportType || '',
                    maxTeams: itemConfig.maxTeams || 0,
                    format: itemConfig.categoryName || '',
                    registeredTeams: 0
                });
                await item.save();
                itemIds.push(item._id);
            }

            tournament.tournamnetItem = itemIds;
            await tournament.save();

            return tournament;
        } catch (error) {
            throw error;
        }
    }

    // === UPDATE SINGLE ===
    static async updateSingleTournament(itemId, userId, updateData) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const item = await TournamentItem.findById(itemId).session(session);
            if (!item) throw new Error('Không tìm thấy giải đấu');
            if (item.tournamentId) throw new Error('API này chỉ dùng cho giải đơn môn độc lập');

            const isLocked = ['playing', 'completed'].includes(item.status);
            if (isLocked) {
                const allowed = new Set(['name', 'description', 'banner', 'logo', 'prizes', 'paymentQR', 'galaConfig', 'location', 'sponsorshipConfig']);
                Object.keys(updateData).forEach((key) => {
                    if (!allowed.has(key)) delete updateData[key];
                });
            }

            // Cập nhật các field
            const fields = ['name', 'description', 'banner', 'logo', 'prizes', 'paymentQR', 'feeEntry', 'sportType', 'maxTeams', 'format'];
            fields.forEach(f => { if (updateData[f] !== undefined) item[f] = updateData[f]; });
            if (updateData.location) item.location = { ...item.location, ...updateData.location };
            if (updateData.registrationConfig) item.registrationConfig = { ...item.registrationConfig, ...normalizeRegistrationConfig(updateData.registrationConfig) };
            if (updateData.paymentConfig) item.paymentConfig = { ...item.paymentConfig, ...normalizePaymentConfig(updateData.paymentConfig) };
            if (updateData.mediaConfig) item.mediaConfig = { ...item.mediaConfig, ...normalizeMediaConfig(updateData.mediaConfig, {}, { logo: updateData.logo || item.logo, banner: updateData.banner || item.banner, paymentQR: updateData.paymentQR || item.paymentQR }) };
            if (updateData.sponsorshipConfig) item.sponsorshipConfig = { ...item.sponsorshipConfig, ...normalizeSponsorshipConfig(updateData.sponsorshipConfig) };
            if (updateData.galaConfig) item.galaConfig = { ...item.galaConfig, ...normalizeGalaConfig(updateData.galaConfig) };
            if (updateData.timeLine && !isLocked) {
                const timelineResult = buildTimeline(updateData.timeLine, { allowPast: true });
                if (!timelineResult.success) throw new Error(timelineResult.errors.join('; '));
                item.timeLine = timelineResult.data;
            }

            await item.save({ session });
            await session.commitTransaction();
            return item;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    // === UPDATE MULTI ===
    static async updateMultiTournament(tournamentId, userId, updateData) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const tournament = await Tournament.findById(tournamentId).session(session);
            if (!tournament) throw new Error('Không tìm thấy hội thao');

            const isLocked = ['playing', 'completed'].includes(tournament.status);
            if (isLocked) {
                const allowed = new Set(['name', 'description', 'banner', 'logo', 'location']);
                Object.keys(updateData).forEach((key) => {
                    if (!allowed.has(key)) delete updateData[key];
                });
            }

            const fields = ['name', 'description', 'banner', 'logo'];
            fields.forEach(f => { if (updateData[f] !== undefined) tournament[f] = updateData[f]; });
            if (updateData.location) tournament.location = { ...tournament.location, ...updateData.location };
            if (updateData.startDate) tournament.startDate = new Date(updateData.startDate);
            if (updateData.endDate) tournament.endDate = new Date(updateData.endDate);

            if (updateData.timeLine && !isLocked) {
                const timelineResult = buildTimeline(updateData.timeLine, { allowPast: true });
                if (!timelineResult.success) throw new Error(timelineResult.errors.join('; '));
                const timeline = timelineResult.data;
                await TournamentItem.updateMany({ tournamentId: tournament._id }, { timeLine: timeline }, { session });
                tournament.startDate = timeline.tournamentStart;
                tournament.endDate = timeline.tournamentEnd;
            }

            if (!isLocked && Array.isArray(updateData.sportRules)) {
                for (const itemConfig of updateData.sportRules) {
                    if (!itemConfig?.categoryRuleId) continue;
                    const item = await TournamentItem.findOne({
                        tournamentId: tournament._id,
                        categoryRule: itemConfig.categoryRuleId
                    }).session(session);
                    if (!item) continue;

                    const itemTimelineResult = itemConfig.registrationStart
                        ? buildTimeline(itemConfig, { allowPast: true })
                        : null;
                    if (itemTimelineResult && !itemTimelineResult.success) {
                        throw new Error(itemTimelineResult.errors.join('; '));
                    }

                    const itemBanner = Array.isArray(itemConfig.itemBanners)
                        ? itemConfig.itemBanners[0]
                        : itemConfig.operations?.banner?.[0];
                    const itemLogo = itemConfig.itemLogo || itemConfig.operations?.logo || item.logo || '';
                    const itemPaymentQR = itemConfig.operations?.paymentQR || item.paymentQR || '';

                    item.name = itemConfig.itemName || item.name;
                    item.description = itemConfig.itemDescription ?? item.description;
                    item.banner = itemBanner || item.banner;
                    item.logo = itemLogo;
                    item.feeEntry = itemConfig.feePerAthlete ?? item.feeEntry;
                    item.paymentQR = itemPaymentQR;
                    item.prizes = itemConfig.prizes ?? item.prizes;
                    item.maxTeams = itemConfig.maxTeams ?? item.maxTeams;
                    item.format = itemConfig.categoryName || item.format;
                    item.sportType = itemConfig.sport || item.sportType;
                    item.location = {
                        ...item.location,
                        detail: itemConfig.location || item.location?.detail || ''
                    };
                    if (itemTimelineResult) item.timeLine = itemTimelineResult.data;
                    item.registrationConfig = {
                        ...item.registrationConfig,
                        ...normalizeRegistrationConfig(itemConfig.registrationConfig, itemConfig.operations)
                    };
                    item.paymentConfig = {
                        ...item.paymentConfig,
                        ...normalizePaymentConfig(itemConfig.paymentConfig, itemConfig.operations)
                    };
                    item.mediaConfig = {
                        ...item.mediaConfig,
                        ...normalizeMediaConfig(itemConfig.mediaConfig, itemConfig.operations, {
                            logo: itemLogo,
                            banner: itemBanner || item.banner,
                            paymentQR: itemPaymentQR
                        })
                    };
                    item.galaConfig = {
                        ...item.galaConfig,
                        ...normalizeGalaConfig(itemConfig.galaConfig || itemConfig.operations)
                    };
                    item.sponsorshipConfig = {
                        ...item.sponsorshipConfig,
                        ...normalizeSponsorshipConfig(itemConfig.sponsorshipConfig, itemConfig.operations)
                    };
                    await item.save({ session });
                }
            }

            if (!isLocked && updateData.addCategoryRuleIds) {
                const newCategoryRuleIds = updateData.addCategoryRuleIds;
                const newRules = await CategoryRule.find({ _id: { $in: newCategoryRuleIds } }).session(session);
                if (newRules.length !== newCategoryRuleIds.length) throw new Error('Một số categoryRule không tồn tại');

                let timeline;
                if (updateData.timeLine) {
                    timeline = buildTimeline(updateData.timeLine);
                } else {
                    const firstItem = await TournamentItem.findOne({ tournamentId: tournament._id }).session(session);
                    timeline = firstItem ? firstItem.timeLine : buildTimeline({
                        registrationStart: new Date().toISOString(),
                        registrationEnd: new Date().toISOString(),
                        tournamentStart: new Date().toISOString(),
                        tournamentEnd: new Date().toISOString()
                    });
                }

                const newItems = [];
                for (const rule of newRules) {
                    const item = new TournamentItem({
                        tournamentId: tournament._id,
                        organization: tournament.organization,
                        categoryRule: rule._id,
                        name: rule.name,
                        banner: tournament.banner,
                        logo: tournament.logo,
                        timeLine: timeline,
                        feeEntry: 0,
                        paymentQR: "",
                        prizes: tournament.prizes || "",
                        location: { city: "", district: "", detail: "" },
                        galaConfig: { hasGala: false },
                        status: 'upcoming',
                        sportType: rule.sportType || '',
                        maxTeams: 0,
                        format: '',
                        registeredTeams: 0
                    });
                    await item.save({ session });
                    newItems.push(item._id);
                    rule.tournamentItemId = item._id;
                    await rule.save({ session });
                }
                tournament.numberOfSport += newItems.length;
                tournament.tournamnetItem.push(...newItems);
            }

            await tournament.save({ session });
            await session.commitTransaction();
            return tournament;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    // === SOFT DELETE SINGLE ===
    static async softDeleteSingle(itemId, userId) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const item = await TournamentItem.findById(itemId).session(session);
            if (!item) throw new Error('Không tìm thấy giải đấu');
            if (item.tournamentId) throw new Error('API này chỉ dùng cho giải đơn môn độc lập');

            if (item.status === 'cancelled') {
                await session.commitTransaction();
                return item;
            }

            // Giải phóng categoryRule
            if (item.categoryRule) {
                await releaseCategoryRules([item.categoryRule], session);
            }

            item.status = 'cancelled';
            await item.save({ session });
            await session.commitTransaction();
            return item;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    // === SOFT DELETE MULTI ===
    static async softDeleteMulti(tournamentId, userId) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const tournament = await Tournament.findById(tournamentId).session(session);
            if (!tournament) throw new Error('Không tìm thấy hội thao');

            if (tournament.status === 'cancelled') {
                await session.commitTransaction();
                return tournament;
            }

            // Lấy tất cả item và giải phóng categoryRule
            const items = await TournamentItem.find({ tournamentId: tournament._id }).session(session);
            const categoryRuleIds = items.map(item => item.categoryRule).filter(Boolean);
            await releaseCategoryRules(categoryRuleIds, session);

            for (const item of items) {
                item.status = 'cancelled';
                await item.save({ session });
            }

            tournament.status = 'cancelled';
            await tournament.save({ session });
            await session.commitTransaction();
            return tournament;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    // === CHANGE STATUS SINGLE ===
    static async changeSingleStatus(itemId, userId, newStatus) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const item = await TournamentItem.findById(itemId).session(session);
            if (!item) throw new Error('Không tìm thấy giải đấu');
            if (item.tournamentId) throw new Error('API này chỉ dùng cho giải đơn môn độc lập');

            if (!isValidStatusTransition(item.status, newStatus)) {
                throw new Error(`Không thể chuyển từ ${item.status} sang ${newStatus}`);
            }

            // Nếu chuyển sang cancelled, giải phóng categoryRule
            if (newStatus === 'cancelled' && item.categoryRule) {
                await releaseCategoryRules([item.categoryRule], session);
            }

            item.status = newStatus;
            await item.save({ session });
            await session.commitTransaction();
            return item;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    // === CHANGE STATUS MULTI ===
    static async changeMultiStatus(tournamentId, userId, newStatus) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const tournament = await Tournament.findById(tournamentId).session(session);
            if (!tournament) throw new Error('Không tìm thấy hội thao');

            if (!isValidStatusTransition(tournament.status, newStatus)) {
                throw new Error(`Không thể chuyển từ ${tournament.status} sang ${newStatus}`);
            }

            // Nếu chuyển sang cancelled, giải phóng categoryRule của tất cả item
            if (newStatus === 'cancelled') {
                const items = await TournamentItem.find({ tournamentId: tournament._id }).session(session);
                const categoryRuleIds = items.map(item => item.categoryRule).filter(Boolean);
                await releaseCategoryRules(categoryRuleIds, session);
                for (const item of items) {
                    item.status = 'cancelled';
                    await item.save({ session });
                }
            }

            tournament.status = newStatus;
            await tournament.save({ session });
            await session.commitTransaction();
            return tournament;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
}

export default TournamentService;
