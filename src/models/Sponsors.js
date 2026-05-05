import mongoose from "mongoose";

const sponsorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    logo: {
        type: String,
        default: "" // URL ảnh logo nhà tài trợ để hiển thị trên website/app
    },
    website: {
        type: String,
        trim: true
    },

    // LIÊN KẾT GIẢI ĐẤU
    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament',
        required: true
    },

    // THÔNG TIN TÀI TRỢ
    sponsorType: {
        type: String,
        enum: ['Diamond', 'Gold', 'Silver', 'Bronze', 'Other'],
        default: 'Gold'
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
        comment: "Số tiền tài trợ cam kết"
    },

    // TRẠNG THÁI THANH TOÁN
    paymentStatus: {
        type: String,
        enum: ['pending', 'partially_paid', 'paid', 'cancelled'],
        default: 'pending'
    },

    // NGƯỜI LIÊN HỆ (Để ban tổ chức gọi khi cần)
    contactPerson: {
        name: String,
        phone: String,
        email: String
    },

    note: {
        type: String,
        maxLength: 500,
        comment: "Các thỏa thuận đặc biệt (VD: Đặt banner ở vị trí A)"
    }
}, {
    timestamps: true
});

const Sponsor = mongoose.model("Sponsor", sponsorSchema);
export default Sponsor;