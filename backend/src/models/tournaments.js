// models/tournaments.js
import mongoose from 'mongoose';

const tournamentSchema = new mongoose.Schema({
    tournamnetItem: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TournamentItem'
    }],
    name: { 
        type: String, 
        required: true, 
        trim: true 
    },
    description: { 
        type: String, 
        trim: true 
    },
    logo: { type: String, default: '' },
    banner: { type: String },
    prizes: { type: String, trim: true, default: '' },
    overview: { type: mongoose.Schema.Types.Mixed, default: {} },
    registrationConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
    paymentConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
    sponsorshipConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
    mediaConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
    galaConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    location: {
        city: { type: String, default: '' },
        district: { type: String, default: '' },
        detail: { type: String, default: '' }
    },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    numberOfSport: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['upcoming', 'actived', 'playing', 'completed', 'cancelled'],
        default: 'upcoming'
    }
}, { timestamps: true });

const Tournament = mongoose.model('Tournament', tournamentSchema);
export default Tournament;
