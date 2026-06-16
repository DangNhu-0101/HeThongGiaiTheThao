interface IConductPenalties {
    yellowCard?: string;
    redCard?: string;
    verbalWarning?: string;
    pointDeduction?: string;
    disqualification?: string;
}

// Subdocument interface for a single Technical Fault
interface ITechnicalFault {
    faultName?: string;
    description?: string;
    penalty?: string;
}

// Main document interface extending Mongoose Document
export interface IFaultsAndPenalties  {
    tournamentId?: string;    // ref: 'Tournament'
    baseRuleId?: string;      // ref: 'BaseRule'
    sport: string[]; // e.g., "pickleball", "tennis"
    ruleName: string;
    description?: string;
    technicalFaults?: ITechnicalFault[];
    conductPenalties?: IConductPenalties;
    createdAt: Date;
    updatedAt: Date;
}