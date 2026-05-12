import mongoose from 'mongoose';

const tournamentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    description: { type: String, trim: true, default: "" },
    logo:{
        type:String,
        default:''
    },

    banner: { type: String },

    sportType:[{
        type: String,
        required: true
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

    status:{
        type: String,
        enum: ['upcoming', 'actived', 'playing','completed', 'cancelled'],
        default: 'upcoming'
    }
}, 
{ timestamps: true });

const Tournament = mongoose.model('Tournament', tournamentSchema);
export default Tournament;