export const createRoundRobinMatches = (teamIds, groupId, tournamentId, bracketId, stageRuleId, sportType, ruleId) => {
    const matches = [];
    let matchNumber = 1;
    for (let i = 0; i < teamIds.length; i++) {
        for (let j = i + 1; j < teamIds.length; j++) {
            matches.push({
                tournamentId,
                bracketId,
                stageRuleId,
                groupId,
                round: 1, // vòng bảng chỉ 1 lượt (có thể thay đổi nếu đá 2 lượt)
                matchNumber: matchNumber++,
                matchType: 'group',
                sportType,
                ruleId,
                team1: teamIds[i],
                team2: teamIds[j],
                status: 'SCHEDULED',
                isPublished: false
            });
        }
    }
    return matches;
};