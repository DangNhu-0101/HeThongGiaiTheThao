import Match from "../../models/matchs.js";

export const autoAssignRefereesProcess = async (matches, referees, durationMs) => {
    let refStats = {};
    referees.forEach(r => refStats[r._id.toString()] = { total: 0, lastEnd: 0, consecutive: 0 });
    const updatePromises = [];

    for (let match of matches) {
        const matchStart = new Date(match.timestart).getTime();
        let bestRef = null;

        let eligibleRefs = referees.filter(r => {
            const stat = refStats[r._id.toString()];
            return (matchStart >= stat.lastEnd) && (stat.consecutive < 2);
        });

        if (eligibleRefs.length === 0) {
            eligibleRefs = referees.filter(r => matchStart >= refStats[r._id.toString()].lastEnd);
        }
        if (eligibleRefs.length === 0) eligibleRefs = referees; 

        let minTotal = Infinity;
        eligibleRefs.forEach(r => {
            if (refStats[r._id.toString()].total < minTotal) {
                minTotal = refStats[r._id.toString()].total;
                bestRef = r;
            }
        });

        if (bestRef) {
            const stat = refStats[bestRef._id.toString()];
            stat.consecutive = (matchStart - stat.lastEnd <= 15*60000) ? stat.consecutive + 1 : 1;
            stat.total += 1;
            stat.lastEnd = Math.max(stat.lastEnd, matchStart + durationMs);

            updatePromises.push(Match.findByIdAndUpdate(match._id, { refereeId: bestRef._id }));
        }
    }
    await Promise.all(updatePromises);
    return updatePromises.length;
};