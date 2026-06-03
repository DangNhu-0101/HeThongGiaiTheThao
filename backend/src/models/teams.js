import mongoose from "mongoose";

const teamSchema = new mongoose.Schema({
    name: { 
        type: String,
         required: true 
    },
    logo: { 
        type: String,
        default: '' 
    },
    ownerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    coachId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        default: null 
    },
    captainId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        default: null 
    }, // hoặc ref 'User'
    tournamentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Tournament', 
        required: true 
    },
    sportCategory: { 
        type: String, 
        required: true 
    }, // hoặc categoryId
    groupId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Group', 
        default: null 
    },
    minPlayers: { 
        type: Number, 
        default: 0 
    },
    maxPlayers: { 
        type: Number, 
        default: 0 
    },
    jerseyColor: { 
        type: String, 
        default: '' 
    },
    status: {
        type: String,
        enum: ['pending', 'validated', 'confirmed', 'playing', 'eliminated', 'champion', 'disqualified', 'withdrawn'],
        default: 'pending'
    },
}, { timestamps: true });

// Đảm bảo mỗi giải chỉ có một đội với tên đó
teamSchema.index({ tournamentId: 1, name: 1 }, { unique: true });

const Team = mongoose.model("Team", teamSchema);
export default Team;
