import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },

    

    hashedPassword: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    
    phoneNumber: {
        type: String,
        trim: true
    },

    displayName: {
        type: String,
        required: true,
        trim: true
    },

    avatarUrl: {
        type: String
    },

    avatarId: {
        type: String
    },
    role:{
        type: String,
        enum: ['Player','Referee','Organization'],
        required: true,
    },
  
},
    {
        
        timestamps: true
    }
);

const User = mongoose.model('User', userSchema);
export default User;