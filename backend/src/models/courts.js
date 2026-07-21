// models/courts.js
import mongoose from "mongoose";

const courtSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    sportTypes: [{ type: String, trim: true }],
    status: {
        type: String,
        enum: ['empty', 'busy', 'maintenance', 'inactived'],
        default: 'empty'
    },
    location: {
        type: String,
        trim: true,
    }
}, {
    timestamps: true
});

courtSchema.index({ name: 1, location: 1 }, { unique: true });
courtSchema.index({ status: 1 });

export default mongoose.model("Court", courtSchema);
