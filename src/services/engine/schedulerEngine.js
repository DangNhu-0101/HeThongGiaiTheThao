export const smartSchedule = (matches, courts, startTimeMs, durationMs, restTimeMs) => {
    let courtAvailability = courts.map(c => ({ court: c, nextFreeTime: startTimeMs }));
    let teamAvailability = {}; 
    const scheduledMatches = [];

    for (let match of matches) {
        const t1Id = match.team1 ? match.team1.toString() : "TBD1";
        const t2Id = match.team2 ? match.team2.toString() : "TBD2";

        const t1Free = teamAvailability[t1Id] || startTimeMs;
        const t2Free = teamAvailability[t2Id] || startTimeMs;
        const earliestTeamFreeTime = Math.max(t1Free, t2Free);

        courtAvailability.sort((a, b) => a.nextFreeTime - b.nextFreeTime);
        let selectedCourt = courtAvailability[0];
        let matchStartTime = Math.max(earliestTeamFreeTime, selectedCourt.nextFreeTime);

        match.court = selectedCourt.court;
        match.timestart = new Date(matchStartTime);
        
        const matchEndTime = matchStartTime + durationMs;
        selectedCourt.nextFreeTime = matchEndTime;
        
        if(match.team1) teamAvailability[t1Id] = matchEndTime + restTimeMs;
        if(match.team2) teamAvailability[t2Id] = matchEndTime + restTimeMs;

        scheduledMatches.push(match);
    }
    return scheduledMatches;
};