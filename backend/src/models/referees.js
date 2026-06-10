import mongoose from 'mongoose';

const refereeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    phoneNumber: {
        type: String,
    },

    name: {
        type: String,
    },

    birthDate: {
        type: Date,
    },

    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
    },

    sports: [{
        category: { type: String },
        yearsOfExperience: { type: Number, default: 0 },
    }],
}, { timestamps: true });

const Referee = mongoose.model('Referee', refereeSchema);
export default Referee;