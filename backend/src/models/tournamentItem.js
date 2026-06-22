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
    prizes: { type: String, trim: true, default: '' },
    overview: { type: mongoose.Schema.Types.Mixed, default: {} },
    registrationConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
    paymentConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
    sponsorshipConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
    mediaConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
    location: {
        city: { type: String, default: '' },
        district: { type: String, default: '' },
        detail: { type: String, default: '' }
    },
    galaConfig: {
        hasGala: { type: Boolean, default: false },
        time: { type: Date, default: null },
        venue: { type: String, default: '' },
        description: { type: String, default: '' }
    },
    sponsors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Sponsor' }],
    status: {
        type: String,
        enum: ['upcoming', 'actived', 'playing', 'completed', 'cancelled'],
        default: 'upcoming'
    },
    // Thêm các trường cho single tournament
    sportType: { type: String, default: '' },
    registeredTeams: { type: Number, default: 0 },
    maxTeams: { type: Number, default: 0 },
    format: { type: String, default: '' }
}, { timestamps: true });

const TournamentItem = mongoose.model('TournamentItem', tournamentItemSchema);
export default TournamentItem;
