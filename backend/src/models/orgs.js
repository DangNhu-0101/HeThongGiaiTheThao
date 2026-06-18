// models/orgs.js
import mongoose from "mongoose";

const orgsSchema = new mongoose.Schema({
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    logo: { type: String, default: '' },
    website: { type: String, default: '' },
    contactEmail: { type: String },
    address: {
        city: String,
        district: String,
        detail: String
    },
    contactPhone: { type: String },
    // Thêm trạng thái duyệt
    status: {
        type: String,
        enum: [ 'actived', 'rejected', 'inactived'],
        default: 'actived'
    },
    // Thêm thời gian và người duyệt
    verifiedAt: { type: Date, default: null },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

const Organization = mongoose.model("Organization", orgsSchema);
export default Organization;