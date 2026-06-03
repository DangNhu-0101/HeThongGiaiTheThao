import mongoose from 'mongoose';

const bracketSchema = new mongoose.Schema({
    tuornamentId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Tuornament',
        required: true
    },
    sportRuleId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"SportRule"
    },
    stageId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'StageRule',
        required: true
    },
    type:{
        type:String,
        enum:["knockout","group_stage","round_robin"]
    },
    name:{
        type:string,
        trim:true,
        required:true
    },
    groups:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Group'
    }],
    knockoutMatches:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Match'
    }],
    slotTeamIn:{
        type:Number,
        default:2
    },
    extraTimeDuration: {
        type: Number,
        default: 30,
    },
    
    hasWildcards: { type: Boolean, default: false },
    wildcardsCount: { type: Number, default: 0, min: 0 },

    timeBreak:{
        hasBreak:{ type: Boolean, default:false},
        breakDuration:{type:Number, default:0}, // đơn vị phút
    },



    pointsConfig: {
        win: { type: Number, default: 3 },
        draw: { type: Number, default: 1 }, // nếu có hòa
        loss: { type: Number, default: 0 },

    },
})