export interface ITimeManagementRule  {
    id: string;
    tournamentId?: String;    // ref: 'Tournament'
    baseRuleId?: String;      // ref: 'BaseRule'
    sport: string; // e.g., "pickleball", "tennis"
    ruleName: string;
    description?: string;
    warmUpMinutes: number;
    standardTimeOutsPerSet: number;
    timeOutDurationSeconds: number;
    medicalTimeOutMinutes: number;
    betweenSetRestMinutes: number;
    maxWaitTimeBeforeForfeit: number;
    createdAt: Date;
    updatedAt: Date;
}