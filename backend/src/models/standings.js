import mongoose from "mongoose";

const standingSchema = new mongoose.Schema({
    teamId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Team',
        required:true
    },
    groupId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Group',
        default:null
    },
    played: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    goalsFor: { type: Number, default: 0 },
    goalsAgainst: { type: Number, default: 0 },
    goalDifference: { type: Number, default: 0 },
    points: { type: Number, default: 0 }
}, { timestamps: true });

const Standing = mongoose.model('Standing', standingSchema);
export default Standing;