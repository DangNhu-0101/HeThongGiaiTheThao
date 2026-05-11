export const calculateMatchTimeline = (ruleInfo) => {
    let baseTime = 0, breakTime = 0, extraTime = 0, buffer = 0, restTime = 0;
    const sport = ruleInfo.sportType;

    if (sport === 'Football') {
        const config = ruleInfo.footballConfig?.matchStructure || {};
        baseTime = (config.halfDuration || 30) * 2;
        breakTime = config.breakTime || 15;
        extraTime = config.hasExtraTime ? (config.extraTimeDuration || 15) * 2 : 0;
        buffer = 10;
        restTime = 45; 
    } 
    else if (sport === 'RacketSport' || sport === 'PickleBall' || sport === 'Tennis' || sport === 'Badminton' || sport === 'TableTennis') {
        const config = ruleInfo.racketConfig || {};
        const subSport = config.subSportType || sport;
        
        const avgSetTime = subSport === 'PickleBall' ? 15 : (subSport === 'Tennis' ? 45 : 20);
        baseTime = (config.setsToWin || 2) * avgSetTime;
        buffer = subSport === 'PickleBall' ? 5 : 15;
        restTime = subSport === 'PickleBall' ? 10 : 30;
    }
    else if (sport === 'Volleyball' || sport === 'VolleyBall') {
         const config = ruleInfo.volleyballConfig || {};
         baseTime = (config.setsToWin || 3) * 25;
         breakTime = ((config.setsToWin || 3) - 1) * 3;
         buffer = 15;
         restTime = 20;
    } else {
        baseTime = 45; breakTime = 5; buffer = 10; restTime = 30;
    }

    const durationMs = (baseTime + breakTime + extraTime + buffer) * 60 * 1000;
    const restTimeMs = restTime * 60 * 1000;

    return { durationMs, restTimeMs };
};