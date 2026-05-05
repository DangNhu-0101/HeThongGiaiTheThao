import mongoose from 'mongoose';


const playerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    teamId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
    }],

    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        unique: true,
        required: true, 
    },

    gender: {
        type: String,
        enum: ['male','female']
    },

    skill: {
        type: Number,
        required:true,
    },
    birthYear: {
        type: Number,
        required: true

    },
    position: {
        type: String,
        comment: "Vị trí sở trường (VD: Tiền đạo, Hậu vệ, Libero...)"
    },
    isAvailable: {
        type: Boolean,
        default: true,
        comment: "Trạng thái sẵn sàng tìm đội hoặc tham gia giải mới"
    },

    status: {
        type: String,
        enum: ['active', 'injured', 'suspended', 'retired'],
        default: 'active'
    }
},

    {
        timestamps: true,
    }

);

const players = mongoose.model("player", playerSchema);
export default players;