interface IScoringFormat {
    name: string;
    pointsToWin: number;
    switchSidesAt?: number; // optional, because required: false
}
interface IStandardSideOut {
    description?: string;
    winByTwo: boolean;
    formats: IScoringFormat[];
}

interface IRallyScoring {
    enabled: boolean;
    description?: string;
    pointsToWin?: number;
}

export interface ScoreRule {
    id: string;
    tournamentId: string; // Reference to Tournament
    categoryId: string; // Reference to Category
    stageId: string; // Reference to Stage
    ruleName: string;
    description?: string;
    standardSideOut?: IStandardSideOut;
    rallyScoring?: IRallyScoring;
    createdAt: Date;
    updatedAt: Date;
}