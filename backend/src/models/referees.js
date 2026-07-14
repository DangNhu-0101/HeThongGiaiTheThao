// models/referees.js
import mongoose from 'mongoose';

const refereeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
  

    phoneNumber: { type: String, default: '' },
    name: { type: String, required: true },
    birthDate: { type: Date },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        default: 'male'
    },
    sports: [{
        category: { type: String },
        yearsOfExperience: { type: Number, default: 0 }
    }],
    // Trạng thái duyệt profile
    status: {
        type: String,
        enum: ['pending', 'actived', 'rejected', 'inactived'],
        default: 'pending'
    },
    verifiedAt: { type: Date, default: null },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

const Referee = mongoose.model('Referee', refereeSchema);
export default Referee;