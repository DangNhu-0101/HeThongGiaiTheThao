import mongoose from 'mongoose';
import Tournament from '../../../../../final/backend/src/models/tournaments';

const sportRuleSchema = new mongoose.Schema({
    ruleName:{
        type:String,
        required:true,
        trim:true
    },
    sportType:{
        type:String,
        enum:["football","table_tennis","tennis","badminton","volleyball","pickleball"],
        required:true,
        trim:true
    },
    numberofPlayers:{
        type:Number,
        required:true
    },
    feeEntry:{
        type:Number,
    },
    numberOfStage:{
        type:Number,
        required:true
    },
    categoryCongif:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'Categories',
    },

    scoringRuleId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'ScoringRule',
    },
    
    status:{
        type:String,
        enum:["active","inactive"],
        default:"active"
    },
})