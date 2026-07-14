import mongoose from "mongoose";

const sponsorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    logo: {
        type: String,
        default: "" 
    },
    website: {
        type: String,
        trim: true
    },

    // LIÊN KẾT GIẢI ĐẤU
    tournamentItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TournamentItem',
        required: true
    },

    // THÔNG TIN TÀI TRỢ
    sponsorType: {
        type: String,
        trim: true,
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

    status: {
        type: String,
        enum: ['actived', 'inactive'],
        default: 'actived'
    }

}, {
    timestamps: true
});

const Sponsor = mongoose.model("Sponsor", sponsorSchema);
export default Sponsor;
