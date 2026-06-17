// models/courts.js
import mongoose from "mongoose";

const courtSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    tournamentItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TournamentItem',
        required: true
    },
    status: {
        type: String,
        enum: ['empty', 'busy', 'maintenance', 'inactive'],
        default: 'empty'
    },
    location: {
        type: String,
        trim: true,
    }
}, {
    timestamps: true
});

courtSchema.index({ tournamentItemId: 1 });
courtSchema.index({ status: 1 });

export default mongoose.model("Court", courtSchema);