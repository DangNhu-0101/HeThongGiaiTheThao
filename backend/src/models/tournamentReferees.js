import mongoose from "mongoose";

const tournamentRefereeSchema = new mongoose.Schema({
    tournamentItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TournamentItem",
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    phoneNumber: {
        type: String,
        trim: true,
        default: ""
    },
    qualification: {
        type: String,
        trim: true,
        default: ""
    },
    experience: {
        type: Number,
        min: 0,
        default: 0
    },
    matchesAssigned: {
        type: Number,
        min: 0,
        default: 0
    },
    status: {
        type: String,
        enum: ["available", "assigned", "unavailable"],
        default: "available"
    }
}, {
    timestamps: true
});

const TournamentReferee = mongoose.model("TournamentReferee", tournamentRefereeSchema);
export default TournamentReferee;
