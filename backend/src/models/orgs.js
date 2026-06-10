import mongoose from "mongoose";

const orgsSchema = new mongoose.Schema({
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    name: {
        type: String,
    },
    logo: { type: String },

    website: { type: String },

    contactEmail: {
        type: String,
    },

    address: {
        city: String,
        district: String,
        detail: String
    },

    contactPhone: {
        type: String,
    },
}, { timestamps: true });

const Organization = mongoose.model("Organization", orgsSchema);
export default Organization;