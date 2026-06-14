import GameRule from '../models/rules/gameRule.js';
import ScoringRule from '../models/rules/scoringRule.js';
import TimeManagementRule from '../models/rules/timeManagementRule.js';
import ResourceManagementRule from '../models/rules/resourceManagementRule.js';
import FaultsAndPenalties from '../models/rules/faultsAndPenalties.js';

async function createRule(Model, data, sportType, session) {
    if (!data || Object.keys(data).length === 0) return null;
    const rule = new Model({ ...data, sportType, status: 'active' });
    if (session) await rule.save({ session });
    else await rule.save();
    return rule._id;
}

export { createRule };