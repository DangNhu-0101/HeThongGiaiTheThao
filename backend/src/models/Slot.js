// models/Slot.js
import mongoose from 'mongoose';


const slotSchema = new mongoose.Schema({
    code: { type: String, required: true }, // R1-B1-G1-P1, R2-B1-M1-1, ...
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
    sportType: { type: String, required: true },
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', default: null },
// 'Pickleball', 'Soccer', ...


    // Phân cấp
    stage: { type: Number, required: true }, // 1: vòng bảng, 2: knockout vòng 1, ...
    branch: { type: Number, default: 1 },
    group: { type: Number, default: null },
    position: { type: Number, default: null }, // 1: nhất, 2: nhì, ...
    round: { type: Number, default: null },
    matchNumber: { type: Number, default: null },
    side: { type: String, enum: ['A', 'B', '1', '2'], default: null },


    // Gán đội
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    status: { type: String, enum: ['empty', 'assigned'], default: 'empty' },


    // Liên kết mặc định (tự động)
    nextSlotCode: { type: String, default: null },
    // Cho phép admin ghi đè
    customNextSlot: { type: String, default: null },
});


slotSchema.index({ tournamentId: 1, sportType: 1 });
slotSchema.index({ tournamentId: 1, sportType: 1, code: 1 }, { unique: true });
const Slot = mongoose.model('Slot', slotSchema);
export default Slot;

