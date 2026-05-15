import Group from '../models/groups.js';

export const updateStandingsAfterMatch = async (match, team1Score, team2Score, session) => {
    if (!match.groupId) return;
    const group = await Group.findById(match.groupId).session(session);
    if (!group) return;

    let standing1 = group.standings.find(s => s.teamId.toString() === match.team1.toString());
    let standing2 = group.standings.find(s => s.teamId.toString() === match.team2.toString());
    if (!standing1 || !standing2) return;

    standing1.played += 1;
    standing2.played += 1;
    standing1.goalsFor += team1Score;
    standing1.goalsAgainst += team2Score;
    standing2.goalsFor += team2Score;
    standing2.goalsAgainst += team1Score;
    standing1.goalDifference = standing1.goalsFor - standing1.goalsAgainst;
    standing2.goalDifference = standing2.goalsFor - standing2.goalsAgainst;

    if (team1Score > team2Score) {
        standing1.wins += 1; standing2.losses += 1; standing1.points += 3;
    } else if (team1Score < team2Score) {
        standing2.wins += 1; standing1.losses += 1; standing2.points += 3;
    } else {
        standing1.draws += 1; standing2.draws += 1; standing1.points += 1; standing2.points += 1;
    }
    await group.save({ session });
};