

export interface Match {
    id: string;
    tournamentId: string;
    bracketId: string;
    stageRuleId: string;
    groupId?: string;
    round: number;
    matchNumber: number;
    matchType: 'group' | 'knockout';
    sportType: string;
    ruleId: string;
    team1: string;
    team2: string;
    winnerTeamId?: string;
    team1Score: number;
    team2Score: number;
    courtId?: string;
    courtName: string;
    scheduledStartTime: Date;
    actualStartTime?: Date;
    endTime?: Date;
    durationMinutes: number;
    status: string;
    refereeId?: string;
    lineReferees: string[];
}