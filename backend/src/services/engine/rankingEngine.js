import Team from "../../models/teams.js";

export const updateTeamRankings = async (match, team1Score, team2Score, ruleInfo) => {
    const { winPoints = 3, drawPoints = 1, lossPoints = 0 } = ruleInfo?.scoringSystem || {};

    if (match.team1) {
        const t1 = await Team.findById(match.team1);
        if (t1) {
            t1.start = t1.start || { matches: 0, won: 0, draw: 0, lost: 0, goalFor: 0, goalAgainst: 0, scoreDiff: 0, points: 0 };
            t1.start.matches += 1;
            t1.start.goalFor += team1Score;
            t1.start.goalAgainst += team2Score;
            t1.start.scoreDiff = t1.start.goalFor - t1.start.goalAgainst;

            if (team1Score > team2Score) { t1.start.won += 1; t1.start.points += winPoints; } 
            else if (team1Score === team2Score) { t1.start.draw += 1; t1.start.points += drawPoints; } 
            else { t1.start.lost += 1; t1.start.points += lossPoints; }
            await t1.save();
        }
    }

    if (match.team2) {
        const t2 = await Team.findById(match.team2);
        if(t2) {
            t2.start = t2.start || { matches: 0, won: 0, draw: 0, lost: 0, goalFor: 0, goalAgainst: 0, scoreDiff: 0, points: 0 };
            t2.start.matches += 1;
            t2.start.goalFor += team2Score;
            t2.start.goalAgainst += team1Score;
            t2.start.scoreDiff = t2.start.goalFor - t2.start.goalAgainst;

            if (team2Score > team1Score) { t2.start.won += 1; t2.start.points += winPoints; } 
            else if (team1Score === team2Score) { t2.start.draw += 1; t2.start.points += drawPoints; } 
            else { t2.start.lost += 1; t2.start.points += lossPoints; }
            await t2.save();
        }
    }
};