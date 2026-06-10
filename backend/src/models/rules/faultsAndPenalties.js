// models/FaultsAndPenalties.js
import mongoose from 'mongoose';

const faultsAndPenaltiesSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, trim: true },
    sportType: { type: String, required: true },

    technicalFaults: [{ type: String }],   // mảng các lỗi kỹ thuật

    conductPenalties: {
        yellowCard: { type: String, default: 'Cảnh cáo' },
        redCard: { type: String, default: 'Truất quyền thi đấu' },
        verbalWarning: { type: String, default: 'Nhắc nhở' }
    },

    penaltyPoints: { type: Number, default: 0 }, // nếu có trừ điểm

    customFaults: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

export default mongoose.model('FaultsAndPenalties', faultsAndPenaltiesSchema);