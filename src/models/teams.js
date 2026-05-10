    import mongoose from "mongoose";

    const teamSchema = new mongoose.Schema({
        teamName: {
            type: String,
            required: true,
            trim: true
        },

        logo: { type: String, default: "" },

        // THÔNG SỐ TRONG GIẢI ĐẤU (Nên để mặc định 0)
        stats: {
            matches: { type: Number, default: 0 },
            won: { type: Number, default: 0 },
            lost: { type: Number, default: 0 },
            draw: { type: Number, default: 0 }, // Thêm trận hòa nếu là bóng đá
            goalFor: { type: Number, default: 0 },
            goalAgainst: { type: Number, default: 0 },
            scoreDiff: { type: Number, default: 0 },
            points: { type: Number, default: 0 }
        },

        // QUẢN TRỊ
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        // LIÊN KẾT GIẢI ĐẤU (Bắt buộc để biết đội đá giải nào)
        tournamentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tournament',
            required: true
        },
        

       // models/teams.js
        status: { 
            type: String, 
            enum: ['pending_payment', 'pending_approval', 'active', 'rejected'], // Viết thường hết cho khỏe
            default: 'pending_payment' 
        },
                
        group: {
            type: String,
            default: 'None' // Để String cho linh hoạt (A, B, C, D, E, F...)
        },

        // TÀI CHÍNH
        isPaid: {
            type: Boolean,
            default: false
        },
        entryFeeReceipt: {
            type: String,
            default: ""
        }
    }, {
        timestamps: true
    });

    const Team = mongoose.model("Team", teamSchema); // Đổi "team" thành "Team" cho đồng bộ
    export default Team;