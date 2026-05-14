import mongoose from 'mongoose';

const tournamentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    slogan: { type: String, trim: true, default: "" },
    targetParticipants: { type: String, default: "0" },

    description: { type: String, trim: true, default: "" },
    logo:{
        type:String,
        default:''
    },

   banners: [{ type: String }],

    sportType:[{
         type: String,
        required: true,
        enum: ['Pickleball', 'Tennis', 'Badminton', 'Table Tennis','Football', 'Volleyball'],
        default: 'Pickleball'
    }],
    sportsConfig: [{
        sport: String,
        feePerAthlete: Number, // Lệ phí theo vận động viên
        maxTeams: Number,      // Giới hạn đội
        categories: [String]   // Nội dung (MS, MD, ...)
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
        location: { type: String, default: "" },
        description: { type: String, default: "" }
    },

    location: {
        type: String,
        trim: true,
        default: ""
    },
    baseRule:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BaseRule',
    }],

    budget: {
        totalSponsor: { type: Number, default: 0 },
        totalExpense: { type: Number, default: 0 },
    },
    contactPerson: {
        name: { type: String, default: "" },
        phone: { type: String, default: "" },
  
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