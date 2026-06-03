const getSlotTeamId = (slot) => {
    if (!slot) return null;
    if (typeof slot === 'object' && 'teamId' in slot) return slot.teamId || null;
    return slot;
};
const getSlotName = (slot, fallback) => slot?.placeholderName || slot?.name || fallback;
const getSlotCodeValue = (slot, fallback) => slot?.slotCode || fallback;

export const createRoundRobinMatches = (teamSlots, groupId, tournamentId, bracketId, stageRuleId, sportType, ruleId, options = {}) => {
    const matches = [];
    let matchNumber = 1;
    const groupCode = options.groupCode || '';

    for (let i = 0; i < teamSlots.length; i++) {
        for (let j = i + 1; j < teamSlots.length; j++) {
            const currentMatchNumber = matchNumber++;
            const slot1Fallback = groupCode ? `${groupCode}-P${i + 1}` : `P${i + 1}`;
            const slot2Fallback = groupCode ? `${groupCode}-P${j + 1}` : `P${j + 1}`;
            matches.push({
                tournamentId,
                bracketId,
                stageRuleId,
                groupId,
                round: 1,
                matchNumber: currentMatchNumber,
                matchType: 'group',
                sportType,
                ruleId,
                team1: getSlotTeamId(teamSlots[i]),
                team2: getSlotTeamId(teamSlots[j]),
                team1Name: getSlotName(teamSlots[i], `Team ${i + 1}`),
                team2Name: getSlotName(teamSlots[j], `Team ${j + 1}`),
                team1SlotCode: getSlotCodeValue(teamSlots[i], slot1Fallback),
                team2SlotCode: getSlotCodeValue(teamSlots[j], slot2Fallback),
                slotCode: groupCode ? `${groupCode}-M${currentMatchNumber}` : '',
                status: 'SCHEDULED',
                isPublished: false
            });
        }
    }

    return matches;
};
