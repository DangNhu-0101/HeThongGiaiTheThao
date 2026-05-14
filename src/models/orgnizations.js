import mongoose from "mongoose";

const OrganizationSchema = new mongoose.Schema({
    OrganizationName: {
        type: String,
        required: true,
        trim: true
    },
    // Liên kết 1-1 với User
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        unique: true,
        required: true
    },

    contactEmail: {
        type: String,
    },  

    phone: {
        type: String,
    },

    address: {
        type: String,
        required: true
    },

    description: {
        type: String,
        maxLength: 500
    },
    // Danh sách các giải đấu mà tổ chức này đã/đang quản lý
    tournaments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament'
    }],

    logoUrl: {
        type: String
    }
}, {
    timestamps: true
});

const Organization = mongoose.model("Organization", OrganizationSchema);
export default Organization;