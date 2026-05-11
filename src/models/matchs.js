import mongoose from "mongoose";


const matchSchema = new mongoose.Schema({
    group: String,

    matchType: {
        type: String,
        enum: ['group', 'knockout']
    },

    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament', // Liên kết với Hội thao lớn
        required: true
    },

    round:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Round',
        required: true
    },

    ruleId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'onModel' 
    },

    // Tên của Model thực tế trong DB (Sẽ lấy qua helper getModelNameForMatch)
    onModel: {
        type: String,
        required: true,
        enum: ['footballRules', 'racketRules', 'volleyballRules', 'BaseRule']
    },

    // Lưu thêm cái này để Controller dễ dùng RuleRegister[sportType]
    sportType: {
        type: String,
        required: true
    },
    
    matchName: {
        type: String // Dùng để đặt tên vòng loại trực tiếp (VD: "Trận Bán Kết 1")
    },
  

    team1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'team' 
    },
    
    team2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'team' 
    },
  

    court: {
        type: String
    },

    timestart: {
        type: Date,
    },

    matchStatus: {
        type: String,
        enum: ['pending', 'playing', 'finished'],
        default: 'pending' 
    },
    refereeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Referee', 
        default: null
    },
    
    lineReferees: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
},
{
    timestamps: true
});

const Match = mongoose.model("Match", matchSchema);
export default Match;
