import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: { 
        type: String,
        required: true, 
        unique: true 
    },

    email: { 
        type: String, 
        required: true, 
        unique: true 
    },

    phoneNumber: {
        type: String, 
        required: true,
        unique: true 
    },
    hashedPassword: { type: String, 
        required: true 
    },

    role: { type: String, 
        enum: ['Organization', 'referee', 'player', 'coach'], 
        default: 'player' 
    },

    avatar: { type: String },

    status: {
        type: String,
        enum: ['active', 'inactive', 'banned'],
        default: 'active'
    }

}
, { timestamps: true });

const User = mongoose.model('User', userSchema);

export default User;