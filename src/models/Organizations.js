import mongoose from "mongoose";

const OrganizationsSchema = new mongoose.Schema({
    ownerId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    name: { 
        type: String, 
        required: true, 
    },
    logo: { type: String },

    website: { type: String },

    contactEmail: { 
        type: String, 
        required: true 
    },
    
    address: {
        city: String,
        district: String,
        detail: String
    },

    contactPhone: { 
        type: String, 
        required: true 
    },
}, { timestamps: true });

const Organization = mongoose.model("Organization", OrganizationsSchema);
export default Organization;