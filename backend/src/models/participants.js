import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema({
    type:{
        type:String,
        enum:['team', 'player'],
        required: true
    },
    tournamentItemId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'TournamentItem'
    },

    name:{
        type:String,
        required:true,
        trim:true
    },

    logo:{
        type:String
    },

    lineup:[{
        Player:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'Player'
        }
    }]

},
{timestamps:true});

const Participant = mongoose.model('Participant', participantSchema);
export default Participant;