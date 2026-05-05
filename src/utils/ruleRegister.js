import FootballRule from '../models/Rule/footballRules.js';
import RacketRule from '../models/Rule/racketRules.js';
import BaseRule from '../models/Rule/baseRules.js';
import VolleyballRule from '../models/Rule/volleyballRules.js';

// FIX: Viết thường chữ 'b' (Pickleball, Volleyball) để khớp với hàm toLowerCase()
export const RuleRegister = {
    Football: FootballRule,
    Tennis: RacketRule,
    Pickleball: RacketRule,   // Đã sửa B -> b
    Volleyball: VolleyballRule, // Đã sửa B -> b
    Badminton: RacketRule,
    TableTennis: RacketRule,
    Default: BaseRule
};

export const getModelNameForMatch = (sportType) => {
    if (!sportType) return RuleRegister.Default.modelName;

    // Chuẩn hóa: pickleball -> Pickleball
    const formattedType = sportType.charAt(0).toUpperCase() + sportType.slice(1).toLowerCase();

    const model = RuleRegister[formattedType] || RuleRegister.Default;
    return model.modelName;
};

export default RuleRegister;