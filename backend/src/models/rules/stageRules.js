import mongoose from 'mongoose';

const StageRuleSchema = new mongoose.Schema({
    tournamentItemId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'TournamentItem'
    },
    number:{
        type:Number,
        reuired:true
    },
    name:{
        type:String,
        required:true,
    },


    pointsConfig: {
        win: { type: Number, default: 3 },
        draw: { type: Number, default: 1 }, // nếu có hòa
        loss: { type: Number, default: 0 },
        // có thể mở rộng: bonusPoint, v.v.
    },

    // Tiêu chí xếp hạng (GROUP_STAGE)
    rankingCriteria: [
        {
            type: String,
            enum: [
                "points",
                "goalDifference",
                "goalsFor",
                "goalsAgainst",
                "headToHead",
                "wins",
                "awayGoals",
                "penaltyShootout",
            ],
        },
    ],

    totalTeamsIn: {
        type: Number,
        required: true,
        min: 2,
    },

    hasWildcards: { type: Boolean, default: false },
    wildcardsCount: { type: Number, default: 0, min: 0 },

    status:{
        type:String,
        enum:['pending', 'active', 'completed'],
        default:'pending'
    }
},
{timestamps:true});

const StageRule = mongoose.model('StageRule',StageRuleSchema)

export default StageRule