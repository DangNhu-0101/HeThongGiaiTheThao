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

    registrationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'suspended'],
        default: 'pending'
    },

    paymentStatus: {
        type: String,
        enum: ['unpaid', 'paid', 'exempted'],
        default: 'unpaid'
    },

    source: {
        type: String,
        enum: ['user', 'organization', 'import'],
        default: 'user'
    },

    representative: {
        name: { type: String, default: '' },
        phone: { type: String, default: '' },
        email: { type: String, default: '' }
    },

    lineup:[{
        Player:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'Player'
        }
    }],

    memberFees: [{
        playerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Player'
        },
        amount: { type: Number, default: 0 },
        status: {
            type: String,
            enum: ['unpaid', 'pending', 'paid', 'exempted'],
            default: 'unpaid'
        },
        receiptImage: { type: String, default: '' },
        paidAt: { type: Date, default: null }
    }]

},
{timestamps:true});

const Participant = mongoose.model('Participant', participantSchema);
export default Participant;
