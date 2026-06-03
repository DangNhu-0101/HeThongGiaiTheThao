import mongoose from 'mongoose';

const stageRuleSchema = new mongoose.Schema({
    tuornamnetId:{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'Tuornament',
        required: true
    },

    SportRuleId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SportRule',
        required: true
    },

    ScoringSystem:{

    },

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
    timeLine:{
        openTime: Date,
        closeTime:Date,
    },
    hasBracket:{
        type:Boolean,
        default:false,
    },
    hasBronzeMatch: {
        type: Boolean,
        default: false,
    },
    hasHomeAway: {
        type: Boolean,
        default: false,
    },
    status:{
        type:String,
        enum:["comingsoon","active","completed",]
    }

},
{timestamps:true});

const StageRule = mongoose.model("StageRule",stageRuleSchema);
export default StageRule;