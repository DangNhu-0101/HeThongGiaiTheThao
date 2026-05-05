import mongoose from "mongoose";

const tournamentSchema = new mongoose.Schema({
    displayName: { type: String, required: true, trim: true },

    year: { type: Number, default: new Date().getFullYear() },

    logo: { type: String },

    // TRẠNG THÁI & THỜI GIAN
    status: {
        type: String,
        enum: ['upcoming', 'playing', 'finished', 'cancelled'],
        default: "upcoming"
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    // LIÊN KẾT
    rules: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "BaseRule", // Chú ý: dùng tên Model chung của bạn (BaseRule)
        required: true
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },

    teams: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team"
    }],

    // TÀI CHÍNH
    budget: {
        totalSponsor: { type: Number, default: 0 },
        totalEntryFee: { type: Number, default: 0 },
        totalExpense: { type: Number, default: 0 }
    }
}, { timestamps: true });

const Tournament = mongoose.model("Tournament", tournamentSchema);

export default Tournament;