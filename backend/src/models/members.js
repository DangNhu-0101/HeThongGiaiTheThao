import mongoose from "mongoose";

const memberSchema = new mongoose.Schema({
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
        required: true
    },
    // Dùng userId để thực hiện các thao tác mời, liên lạc
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    // Dùng playerId để lấy chỉ số thi đấu (Skill, Position)
    playerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Player"
    },

    role: {
        type: String,
        enum: ['Captain', 'Member',],
        default: 'Member'
    },


    status: {
    type: String,
    enum: ['Invited', 'Pending', 'Active', 'Rejected'], // BẮT BUỘC thêm 'Active' vào đây
    default: 'Invited'
},

    joinedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Đảm bảo một người không bị add vào một đội 2 lần
memberSchema.index({ teamId: 1, userId: 1 }, { unique: true });

const Member = mongoose.model("Member", memberSchema);
export default Member;