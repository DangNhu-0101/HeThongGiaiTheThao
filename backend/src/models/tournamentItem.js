import mongoose from 'mongoose';
import stageRules from './rules/stageRules';

const tournamentItemSchema = new mongoose.Schema({
    tournamentId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament',
        required: true,
    },
    organization:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    categoryRule: { type: mongoose.Schema.Types.ObjectId, ref: 'CategoryRule' },

    structure:{
        stage:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'StageRule'
        },
        bracket:{
            type: mongoose.Schema.Types.ObjectId,
            ref:'Bracket'
        },
        group:{
            type: mongoose.Schema.Types.ObjectId,
            ref:'Group'
        },
        round:{
            type: mongoose.Schema.Types.ObjectId,
            ref:'Round'
        }
    },
    name:{
        type:String,
        required:true,
        trim:true
    },

    banner:{
        type:String
    },

    logo:{
        type:String
    },

    timeLine:{
        registrationStart: { type: Date, required: true },
        registrationEnd: { type: Date, required: true },
        tournamentStart: { type: Date, required: true },
        tournamentEnd: { type: Date, required: true },
    },

    feeEntry: {
        type: Number,
        default: 0
    },
    paymentQR: { type: String, default: "" },
    prizes: { type: String, trim: true, default: "" },

    location: {
        city: String,
        district: String,
    },

    galaConfig: {
        hasGala: { type: Boolean, default: false },
        time: { type: Date, default: null },
        venue: { type: String, default: "" },
        description: { type: String, default: "" }
    },

    sponsors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sponsor',
    }],

    status: {
        type: String,
        enum: ['upcoming', 'actived', 'playing', 'completed', 'cancelled'],
        default: 'upcoming'
    },
    

});

const TournamentItem = mongoose.model('TournamentItem', tournamentItemSchema);

export default TournamentItem;