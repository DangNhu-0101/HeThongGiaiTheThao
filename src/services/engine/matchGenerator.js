export const generateKnockoutBracket = (teams, groups, ruleInfo, tournamentId) => {
    const numGroups = groups.length;
    let knockoutSize = numGroups >= 3 ? 8 : 4; 
    
    // Tìm lũy thừa của 2 gần nhất nếu số lượng bảng lẻ
    let currentSize = Math.pow(2, Math.ceil(Math.log2(knockoutSize))); 
    
    const knockoutMatches = [];
    const stages = { 16: "Vòng 1/8", 8: "Tứ Kết", 4: "Bán Kết", 2: "Chung Kết" };

    while (currentSize >= 2) {
        const matchesInRound = currentSize / 2;
        const stageName = stages[currentSize];

        for (let i = 1; i <= matchesInRound; i++) {
            let t1Name = "Đang chờ"; let t2Name = "Đang chờ";

            if (currentSize === knockoutSize) {
                if (knockoutSize === 8) { 
                    const g1 = groups[(i - 1) % numGroups] || `A`;
                    const g2 = groups[i % numGroups] || `B`;
                    t1Name = `Nhất Bảng ${g1}`; t2Name = `Nhì Bảng ${g2}`;
                } else { 
                    const g1 = groups[(i - 1) * 2 % numGroups] || `A`;
                    const g2 = groups[((i - 1) * 2 + 1) % numGroups] || `B`;
                    t1Name = `Nhất Bảng ${g1}`; t2Name = `Nhì Bảng ${g2}`;
                }
            } else {
                const prevStageName = stages[currentSize * 2];
                t1Name = `Thắng ${prevStageName} ${i * 2 - 1}`;
                t2Name = `Thắng ${prevStageName} ${i * 2}`;
            }

            knockoutMatches.push({
                tournamentId: tournamentId,
                ruleId: ruleInfo._id,
                onModel: ruleInfo.__t || 'BaseRule',
                sportType: ruleInfo.sportType,
                matchName: currentSize === 2 ? "Chung Kết" : `${stageName} ${i}`,
                stage: 'knockout',
                matchType: 'knockout',
                team1: null, team1Name: t1Name,
                team2: null, team2Name: t2Name,
                isPublished: false
            });
        }
        currentSize = currentSize / 2;
    }
    return knockoutMatches;
};