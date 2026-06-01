import mongoose from 'mongoose';

const tournamentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    description: { type: String, trim: true, default: "" },
    slogan: { type: String, trim: true, default: "" },
    targetAudience: { type: String, trim: true, default: "" },
    contactPerson: {
        name: { type: String, default: "" },
        phone: { type: String, default: "" }
    },
    logo:{
        type:String,
        default:''
    },

    banner: { type: String },

    sportType:[{
        type: String,
        required: true
    }],
    sportsConfig: [{
        sport: { type: String, required: true },
        sportName: { type: String, default: "" },
        feeEntry: { type: Number, default: 0 },
        feePerAthlete: { type: Number, default: 0 },
        maxTeams: { type: Number, default: null },
        categories: [{ type: String }],
        categoryConfig: [{ type: mongoose.Schema.Types.Mixed }]
    }],

    timeLine:{
        registrationStart: {type: Date,required: true},
        registrationEnd: {type: Date,required: true},
        tournamentStart: {type: Date,required: true},
        tournamentEnd: {type: Date,required: true},
    },
    paymentQR: { type: String, default: "" },
    prizes: { type: String, trim: true, default: "" },

    galaConfig: {
        hasGala: { type: Boolean, default: false },
        time: { type: Date, default: null },
        venue: { type: String, default: "" },
        description: { type: String, default: "" }
    },

    location: {
        city: String,
        district: String,
    },
    baseRule:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BaseRule',
    }],

    budget: {
        totalSponsor: { type: Number, default: 0 },
        totalExpense: { type: Number, default: 0 },
    },
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },

    sponsors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sponsor',
    }],

    sponsorPackages: [{
        name: String,
        benefitsText: String,
        benefitsImage: String,
    }],

    status:{
        type: String,
        enum: ['upcoming', 'Actived', 'playing','completed', 'cancelled'],
        default: 'upcoming'
    }
}, 
{ timestamps: true });

const Tournament = mongoose.model('Tournament', tournamentSchema);
export default Tournament;
