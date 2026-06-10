import mongoose from "mongoose";

const courtSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        // Ví dụ: "Sân Đa Năng A1", "Sân Pickleball & Tennis 01"
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
        // Lưu vị trí cụ thể trong cụm sân (VD: Khu A, Tầng 2)
    }
}, { 
    timestamps: true 
});

// Tạo Index cho tournamentId và sportTypes
courtSchema.index({ tournamentId: 1 });
courtSchema.index({ sportTypes: 1 });


export default mongoose.model("Court", courtSchema);