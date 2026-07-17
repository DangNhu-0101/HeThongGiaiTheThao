// models/tournamentItem.js
import mongoose from 'mongoose';

const tournamentItemSchema = new mongoose.Schema({
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', default: null },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    categoryRule: { type: mongoose.Schema.Types.ObjectId, ref: 'CategoryRule' },
    structure: {
        stage: [{ type: mongoose.Schema.Types.ObjectId, ref: 'StageRule' }],
        bracket: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Bracket' }],
        group: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    banner: { type: String },
    logo: { type: String },
    timeLine: {
        registrationStart: { type: Date, required: true },
        registrationEnd: { type: Date, required: true },
        tournamentStart: { type: Date, required: true },
        tournamentEnd: { type: Date, required: true },
    },
    feeEntry: { type: Number, default: 0 },
    paymentQR: { type: String, default: '' },
    registrationConfig: {
        mode: { type: String, enum: ['system', 'external'], default: 'system' },
        formUrl: { type: String, default: '' },
        zaloGroupUrl: { type: String, default: '' },
        maxRegistrations: { type: Number, default: 0 },
        instructions: { type: String, default: '' },
        supportContacts: { type: String, default: '' }
    },
    paymentConfig: {
        feeIncludes: { type: mongoose.Schema.Types.Mixed, default: [] },
        bankName: { type: String, default: '' },
        accountName: { type: String, default: '' },
        accountNumber: { type: String, default: '' },
        transferContent: { type: String, default: '' },
        instructions: { type: String, default: '' },
        refundPolicy: { type: String, default: '' }
    },
    mediaConfig: {
        consent: { type: Boolean, default: false },
        usageTerms: { type: String, default: '' },
        logoUrl: { type: String, default: '' },
        bannerUrls: { type: [String], default: [] },
        paymentQRUrl: { type: String, default: '' }
    },
    prizes: { type: String, trim: true, default: '' },
    location: {
        city: { type: String, default: '' },
        district: { type: String, default: '' },
        detail: { type: String, default: '' }
    },
    galaConfig: {
        hasGala: { type: Boolean, default: false },
        time: { type: Date, default: null },
        start: { type: Date, default: null },
        end: { type: Date, default: null },
        venue: { type: String, default: '' },
        description: { type: String, default: '' }
    },
    sponsors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Sponsor' }],
    sponsorshipConfig: {
        contact: { type: String, default: '' },
        tiers: { type: mongoose.Schema.Types.Mixed, default: [] }
    },
    status: {
        type: String,
        enum: ['upcoming', 'actived', 'playing', 'completed', 'cancelled'],
        default: 'upcoming'
    },
    // Thêm các trường cho single tournament
    sportType: { type: String, default: '' },
    registeredTeams: { type: Number, default: 0 },
    maxTeams: { type: Number, default: 0 },
    format: { type: String, default: '' },
    competitionFormat: {
        selectedType: {
            type: String,
            enum: ['preset', 'template', 'custom', 'none'],
            default: 'none'
        },
        presetId: { type: String, default: '' },
        presetSource: {
            type: String,
            enum: ['json', 'categoryRule', 'categoryTemplate', 'competition-template', ''],
            default: ''
        },
        name: { type: String, default: '' },
        sportType: { type: String, default: '' },
        description: { type: String, default: '' },
        stageCount: { type: Number, default: 0 },
        config: { type: mongoose.Schema.Types.Mixed, default: null },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        updatedAt: { type: Date, default: null }
    }
}, { timestamps: true });

const TournamentItem = mongoose.model('TournamentItem', tournamentItemSchema);
export default TournamentItem;
