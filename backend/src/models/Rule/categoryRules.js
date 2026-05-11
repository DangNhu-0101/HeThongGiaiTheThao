import mongoose from "mongoose";
import Tournament from "../tournament.js";

// Schema cho Category
const categorySchema = new mongoose.Schema({
    categoryId: {
        type: String,
        required: true
    },
    categoryName: {
        type: String,
        required: true
    },
    minPlayers: {
        type: Number,
        required: true
    },
}, { _id: false });

// Main Category Rules Schema
const categoryRulesSchema = new mongoose.Schema({
    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament',
        required: false
    },
    sport: {
        type: String,
        required: true,
        enum: ['Football', 'Basketball', 'Volleyball', 'Tennis', 'Table Tennis', 'Badminton', 'Pickleball', 'Other']
    },
    ruleName: {
        type: String,
        required: true,
        trim: true
    },
    categories: [categorySchema],
},
    { timestamps: true });

const CategoryRule = mongoose.model("CategoryRule", categoryRulesSchema);
export default CategoryRule;
