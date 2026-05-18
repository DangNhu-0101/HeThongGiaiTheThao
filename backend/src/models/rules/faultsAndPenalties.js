import mongoose from "mongoose";


// Schema cho Conduct Penalties
const conductPenaltiesSchema = new mongoose.Schema({
    yellowCard: String,
    redCard: String,
    verbalWarning: String,
    pointDeduction: String,
    disqualification: String
}, { _id: false });

// Main Faults and Penalties Schema
const faultsAndPenaltiesSchema = new mongoose.Schema({
    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament',
        required: false
    },

    baseRuleId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BaseRule'
    },
    sport: {
        type: String,
        required: true,
        enum: ['Soccer', 'Basketball', 'Volleyball', 'Tennis', 'Table Tennis', 'Badminton', 'Pickleball', 'Other']
    },
    ruleName: {
        type: String,
        required: true,
        trim: true
    },
    description: String,
    technicalFaults: [
        {
            faultName: String,
            description: String,
            penalty: String
        }
    ],
    conductPenalties: {
        type: conductPenaltiesSchema,
        required: false
    },
}, 
    { timestamps: true });

const FaultsAndPenalties = mongoose.model("FaultsAndPenalties", faultsAndPenaltiesSchema);
export default FaultsAndPenalties;
