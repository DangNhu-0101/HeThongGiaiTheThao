import mongoose from 'mongoose';

const tournamentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
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

    location: {
        city: String,
        district: String,
    },
    baseRule:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BaseRule',
    }],

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