// models/players.js
import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    name: {
        type: String,
        required: true
    },
    avatar: { type: String, default: '' },
    birthDate: {
        type: Date,
        required: true
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true
    },
    skill:{
        type:Number,
        required:true
    },
    jerseyNumber: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: String, default: '' },
    note: { type: String, default: '' },
    sports: [{
        category: { type: String },
        level: { type: String },
        position: { type: String }
    }],
    status: {
        type: String,
        enum: ['actived', 'injured', 'unavailable'],
        default: 'actived'
    }
}, { timestamps: true });

const Player = mongoose.model('Player', playerSchema);
export default Player;
