import StageRule from '../models/rules/stageRules.js';

// LƯU CẤU HÌNH
export const saveStages = async (req, res) => {
    try {
        const { tournamentId } = req.params;
        const { sportType, formatDescription, ruleDescription, stageTree } = req.body;

        // Xóa cấu hình cũ nếu có
        await StageRule.deleteMany({ tournamentId, sportType });

        // Lưu từng stage gốc (có thể có nhiều nếu chia nhánh từ đầu)
        const savedDocs = [];
        for (const stage of stageTree) {
            const doc = await StageRule.create({
                tournamentId,
                sportType,
                formatDescription,
                ruleDescription,
                ...flattenStage(stage)
            });
            savedDocs.push(doc);
        }

        res.status(201).json({ success: true, data: savedDocs });
    } catch (error) {
        console.error("saveStages error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// LẤY CẤU HÌNH
export const getStages = async (req, res) => {
    try {
        const { tournamentId } = req.params;
        const { sportType } = req.query;

        const filter = { tournamentId };
        if (sportType) filter.sportType = sportType;

        const stages = await StageRule.find(filter).lean();

        res.status(200).json({ success: true, data: stages });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Helper: chuyển stage tree thành flat structure
function flattenStage(stage) {
    return {
        stageName: stage.stageName,
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
        touchPoint: stage.touchPoint,
        winByGap: stage.winByGap,
        maxPoints: stage.maxPoints,
        changeSideAt: stage.changeSideAt,
        substages: (stage.substages || []).map(s => flattenStage(s))
    };
}