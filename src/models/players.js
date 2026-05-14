import moogoose from 'mongoose';

const playerSchema = new moogoose.Schema({
    userId: {
        type: moogoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    name: { 
        type: String, 
        required: true },
    birthDate: { 
        type: Date, 
        required:true
    },
    gender: { type: String, 
        enum: ['male', 'female', 'other'], 
        required: true 
    },
    sports: [{ 
        category: {type: String,},
        level: {type: String,},
        position: {type: String,}
    }],

    status: {
        type: String,
        enum: ['active', 'injured', 'unavailable', 'deleted'],
        default: 'active'
    }
    
}, { timestamps: true });

const Player = moogoose.model('Player', playerSchema);
export default Player;