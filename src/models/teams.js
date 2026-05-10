import mongoose from "mongoose";

const teamSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        unique: true 
    },
    logo: { type: String },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament',
        required: true
    },
    sportCategory: {
        type: String,
        required: true 
    },
    group: { type: String, default: '' },
    status: {
        type: String,
        enum: ['pending', 'validated', 'confirmed', 'playing', 'eliminated', 'champion'],
        default: 'pending'
    },
}, { timestamps: true });

const Team = mongoose.model("Team", teamSchema);
export default Team;
