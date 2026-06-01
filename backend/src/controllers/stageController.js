import StageRule from '../models/rules/stageRules.js';
import Rule from '../models/rules.js';

export const saveStages = async (req, res) => {
    try {
        const { tournamentId } = req.params;
        const { sportType, formatDescription, ruleDescription, stageTree = [] } = req.body;

        const stages = stageTree.map(stage => ({
            tournamentId,
            sportType,
            formatDescription,
            ruleDescription,
            ...flattenStage(stage)
        }));

        const rule = await Rule.findOneAndUpdate(
            { tournamentId },
            {
                $set: {
                    tournamentId,
                    sportType,
                    ruleName: `Cấu hình vòng đấu ${sportType || ''}`.trim(),
                    formatDescription,
                    ruleDescription,
                    stageTree,
                    stages,
                    rankingCriteria: stages[0]?.rankingCriteria || stages[0]?.rankingPriorityOrder || ['points', 'scoreDiff', 'goalFor']
                }
            },
            { new: true, upsert: true, runValidators: true }
        );

        res.status(201).json({ success: true, data: stages, rule });
    } catch (error) {
        console.error("saveStages error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getStages = async (req, res) => {
    try {
        const { tournamentId } = req.params;
        const { sportType } = req.query;

        const rule = await Rule.findOne({ tournamentId }).lean();
        if (rule) {
            const stages = sportType
                ? (rule.stages || []).filter(stage => stage.sportType === sportType)
                : (rule.stages || []);

            return res.status(200).json({
                success: true,
                data: stages,
                rule: {
                    _id: rule._id,
                    tournamentId: rule.tournamentId,
                    sportType: rule.sportType,
                    formatDescription: rule.formatDescription,
                    ruleDescription: rule.ruleDescription,
                    stageTree: rule.stageTree || [],
                    stages: rule.stages || []
                }
            });
        }

        const filter = { tournamentId };
        if (sportType) filter.sportType = sportType;
        const stages = await StageRule.find(filter).lean();

        res.status(200).json({ success: true, data: stages });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

function flattenStage(stage) {
    return {
        id: stage.id,
        parentId: stage.parentId,
        stageNumber: stage.stageNumber,
        stageName: stage.stageName,
        branchName: stage.branchName,
        type: stage.type,
        hasBranches: stage.hasBranches,
        branches: stage.branches,
        knockoutRound: stage.knockoutRound,
        hasBronzeMatch: stage.hasBronzeMatch,
        totalTeamsIn: stage.totalTeamsIn,
        hasWildcards: stage.hasWildcards,
        wildcardsCount: stage.wildcardsCount,
        wildcardCriteria: stage.wildcardCriteria,
        wildcardPriorityOrder: stage.wildcardPriorityOrder,
        winPoints: stage.winPoints,
        lossPoints: stage.lossPoints,
        rankingCriteria: stage.rankingCriteria,
        rankingPriorityOrder: stage.rankingPriorityOrder,
        matchFormat: stage.matchFormat,
        matchDuration: Number(stage.matchDuration || 60),
        touchPoint: stage.touchPoint,
        winByGap: stage.winByGap,
        maxPoints: stage.maxPoints,
        changeSideAt: stage.changeSideAt,
        substages: (stage.substages || []).map(s => flattenStage(s))
    };
}
