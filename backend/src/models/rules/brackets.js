import mongoose from 'mongoose';
import TournamentItem from '../tournamentItem';

const bracketSchema =new mongoose.Schema({
    TournamentItem:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TournamentItem',
        required:true
    },
    stageId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StageRule',
        required:true
    },

    type: {
        type: String,
        enum: ['group', 'knockout'],
        required: true
    },
    name:{
        type:String
    },
    totalTeamsIn: {
        type: Number,
        required: true,
        min: 2,
    },
    group:[{
        type: mongoose.Schema.Types.ObjectId,
        ref:'Group'
    }]
},
{timestamps:true}
);

const Bracket =mongoose.model('Bracket',bracketSchema)
export default Bracket;