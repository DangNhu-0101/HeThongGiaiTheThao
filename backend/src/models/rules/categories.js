import mongoose from "mongoose";
import Tournament from "../tournament.js";

// Schema cho Category (gọn hơn)
const categorySchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        uppercase: true,  // Ví dụ: "MD", "WD", "MS", "WS"
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    minPlayers: {
        type: Number,
        required: true,
        min: 1
    },
    maxPlayers: {
        type: Number,
        default: null  // null = không giới hạn, có thể set cho doubles là 2
    },
    description: {
        type: String,
        default: ""
    }
}, { _id: false });

// Main Category Rules Schema
const categoryRulesSchema = new mongoose.Schema({
    // Liên kết
    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament',
        required: false
    },

    // Thông tin định danh
    sport: {
        type: String,
        required: true,
        enum: ['Soccer', 'Basketball', 'Volleyball', 'Tennis', 'Table Tennis', 'Badminton', 'Pickleball', 'Other']
    },

    ruleName: {
        type: String,
        required: true,
        trim: true
    },
    // Dữ liệu chính
    categories: [categorySchema],


}, {
    timestamps: true,
    // Đảm bảo unique theo sport + ruleName
    indexes: [
        { unique: true, fields: { sport: 1, ruleName: 1 } }
    ]
});



const CategoryRule = mongoose.model("CategoryRule", categoryRulesSchema);
export default CategoryRule;