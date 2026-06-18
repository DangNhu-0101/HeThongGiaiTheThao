// models/players.js
import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    birthDate: {
        type: Date,
        required: true
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true
    },
    skill:{
        type:Number,
        required:true
    },
    sports: [{
        category: { type: String },
        level: { type: String },
        position: { type: String }
    }],
    // Trạng thái duyệt profile

    // Trạng thái thi đấu (có thể giữ lại hoặc gộp chung, nhưng tôi đề xuất giữ riêng)
    status: {
        type: String,
        enum: ['actived', 'injured', 'unavailable'],
        default: 'actived'
    }
}, { timestamps: true });

const Player = mongoose.model('Player', playerSchema);
export default Player;