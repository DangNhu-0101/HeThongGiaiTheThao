interface ICourts {
    minRequired: number;
    dimensions?: string;
    surfaceType?: string[];
}

// Subdocument interface for Personnel Per Match
interface IPersonnelPerMatch {
    mainReferee: number;
    lineJudges: number;
    scoreKeepers: number;
    linesmen: number;
}

// Subdocument interface for Equipment
interface IEquipment {
    ballType?: string;
    netHeightCenter?: string;
    courtSurface?: string;
    otherEquipment?: string[];
}

// Main document interface extending Mongoose Document
export interface IResourceManagementRule  {
    id: string;
    tournamentId?: string;     // ref: 'Tournament'
    baseRuleId: string;        // ref: 'BaseRule', required
    sport?: string[]; // e.g., "pickleball", "tennis"
    ruleName: string;
    description?: string;
    courts?: ICourts;
    personnelPerMatch?: IPersonnelPerMatch;
    equipment?: IEquipment;
    createdAt: Date;
    updatedAt: Date;
}