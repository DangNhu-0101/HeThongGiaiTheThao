import mongoose from "mongoose";

const tournamentSchema = new mongoose.Schema({
    // 📌 THÔNG TIN CƠ BẢN
    displayName: { type: String, required: true, trim: true },
    slogan: { type: String, trim: true, default: "" },
    targetAudience: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    venue: { type: String, required: true, trim: true },
    contactPerson: { type: String, trim: true, default: "" },
    year: { type: Number, default: () => new Date().getFullYear() },

    // 🖼️ HÌNH ẢNH & NHẬN DIỆN
    logo: { type: String, default: "" },
    banner: { type: String, default: "" },
    paymentQR: { type: String, default: "" }, // Ảnh QR Code thanh toán của giải

    // 💰 GIẢI THƯỞNG
    prizes: { type: String, trim: true, default: "" },

    // ⏱️ TRẠNG THÁI & THỜI GIAN
    status: {
        type: String,
        enum: ['upcoming', 'playing', 'finished', 'cancelled'],
        default: "upcoming"
    },
    timeLine: {
        timeRegiter: { type: Date, default: null },
        timeCloseRegister: { type: Date, default: null },
        timeOpen: { type: Date, default: Date.now },
        timeClose: { type: Date, default: null }
    },

    // 🏅 CẤU HÌNH MÔN THI ĐẤU (Thay thế cho mảng 'sports' chuỗi cũ)
    sportsConfig: [{
        sport: { 
            type: String, 
            enum: ['Football', 'Basketball', 'Volleyball', 'Tennis', 'Table Tennis', 'Badminton', 'Pickleball', 'Other'],
            required: true 
        },
        feeEntry: { type: Number, default: 0 },
        maxTeams: { type: Number, default: null }, // Null hoặc bỏ trống tức là Không giới hạn
        categories: [{ type: String }] // VD: ['MS', 'WS', 'MD', 'XD']
    }],

    // 🥂 SỰ KIỆN GALA
    galaConfig: {
        hasGala: { type: Boolean, default: false },
        time: { type: Date, default: null },
        venue: { type: String, default: "" },
        description: { type: String, default: "" }
    },

    // ⚙️ LIÊN KẾT LUẬT (Chờ màn hình RuleFormModal xử lý và push ID vào đây)
    rules: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "BaseRule"
    }],
    
    // 👤 PHÂN QUYỀN & QUẢN TRỊ
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

    // 💵 TÀI CHÍNH TỔNG CHI
    budget: {
        totalSponsor: { type: Number, default: 0 },
        totalExpense: { type: Number, default: 0 }
        // totalEntryFee (Doanh thu thực tế) sẽ được tính động từ mảng các Team đã nộp tiền
    }
}, { timestamps: true });

const Tournament = mongoose.model("Tournament", tournamentSchema);

export default Tournament;