import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema({
    orgName: {
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
        required: true
    },  

    phone: {
        type: String,
        required: true
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

const Organization = mongoose.model("organizations", organizationSchema);
export default Organization;