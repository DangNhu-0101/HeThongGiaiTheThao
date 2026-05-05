import mongoose from "mongoose";

const refereeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true
    },
    // Liên kết với User
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        unique: true,
        required: true,
    },
    // Thông tin nghề nghiệp
    experienceYears: {
        type: Number,
        required: true,
        min: 0
    },
    birthYear: {
        type: Number,
        required: true
    },
    specializedSports: [{
        type: String,
        comment: "Môn thể thao sở trường: Football, Volleyball..."
    }],
    // Trạng thái vận hành
    status: {
        type: String,
        enum: ['available', 'busy', 'inactive'],
        default: 'available'
    },
    avatarUrl: { type: String }
}, {
    timestamps: true // Thêm để biết trọng tài này tham gia hệ thống khi nào
});

const Referee = mongoose.model("Referee", refereeSchema);
export default Referee;