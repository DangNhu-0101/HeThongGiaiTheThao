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
        unique: true
    },

    name: {
        type: String,
        required: true
    },

    birthDay: {
        type: Date,
        required: true
    },

    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true
    },

    sports: [{
        category: { type: String },
        yearsOfExperience: { type: Number, default: 0 },
    }],
}, { timestamps: true });

const Referee = mongoose.model('Referee', refereeSchema);
export default Referee;