import mongoose from "mongoose";

// Cấu hình chung cho Discriminator
const baseOptions = {
    discriminatorKey: 'sportType', // Key quyết định luật riêng của từng môn
    collection: 'rules',
    timestamps: true
};

const baseRuleSchema = new mongoose.Schema({

    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament',
        required: false
    },
    // 1. THÔNG TIN ĐỊNH DANH
    ruleName: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    description: { type: String },

    // 2. PHÂN LOẠI CƠ BẢN (Core Classification)
    participantType: {
        type: String,
        enum: ['Single', 'Double', 'Team'],
        required: true
    },

    genderFormat: {
        type: String,
        enum: ['Male', 'Female', 'Mixed', 'Any'],
        default: 'Any'
    },

    competitionFormat: {
        type: String,
        enum: ['League', 'Knockout', 'Group+Knockout', 'Double-Elimination'], // Thi đấu vòng tròn,Loại trực tiếp,Kết hợp
        required: true
    },

    // 3. QUY ĐỊNH NHÂN SỰ TỔNG QUÁT (General Roster)
    // Dùng được cho cả cá nhân (min/max = 1) và đội nhóm
    rosterConfig: {
        minParticipantsPerSide: { type: Number, required: true }, // Số người tối thiểu để bắt đầu
        maxParticipantsPerSide: { type: Number, required: true }, // Số người tối đa được đăng ký
        officialLimit: { type: Number, default: 0 }               // Giới hạn lãnh đạo/HLV
    },

    // QUẢN LÝ ĐỘI
    registration: {
        maxTeams: { type: Number, default: 16 },
        deadline: { type: Date }
    },

    // 5. HỆ THỐNG TÍNH ĐIỂM XẾP HẠNG (Ranking System)
    scoringSystem: {
        winPoints: { type: Number, default: 3 },
        drawPoints: { type: Number, default: 1 },
        lossPoints: { type: Number, default: 0 },
        rankingCriteria: {
            type: [String],
            default: ['points', 'headToHead', 'diff'] // Thứ tự ưu tiên khi xét BXH
        }
    },

    // 6. QUY ĐỊNH TÀI CHÍNH (Finance)
    economics: {
        entryFee: { type: Number, required: true },
        currency: { type: String, default: 'VND' },
        refundPolicy: { type: String }
    },

    timeline: {
        openDate: { type: Date },
        closeDate: { type: Date },
        maxTeams: { type: Number } // Giới hạn số đội được phép đăng ký vào giải này
    },

    // 7. TRẠNG THÁI (Status)
    status: {
        isActive: { type: Boolean, default: true },
        isLocked: { type: Boolean, default: false }, // Khóa rule khi giải đang diễn ra
    }
}, baseOptions);

const BaseRule = mongoose.model("BaseRule", baseRuleSchema);
export default BaseRule;