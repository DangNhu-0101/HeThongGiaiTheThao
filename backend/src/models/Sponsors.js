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
    
    sponsorshipType: {
        type: String,
        enum: ['Money', 'Goods', 'Services'],
        default: 'Money'
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },

    // NGƯỜI LIÊN HỆ (Để ban tổ chức gọi khi cần)
    contactPerson: {
        name: String,
        phone: String,
        email: String
    },

    status:{
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }

}, {
    timestamps: true
});

const Sponsor = mongoose.model("Sponsor", sponsorSchema);
export default Sponsor;