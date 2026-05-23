import type {Stage} from "./stage";
import type {Category} from "./category";
import type{GameRule} from "./gameRule";
import type {ScoreRule} from "./scoreRule";
import type {ITimeManagementRule} from "./timeManagement";
import type {IResourceManagementRule} from "./resourceManagement";
import type {IFaultsAndPenalties} from "./faultsAndPenalties";

interface tournamentStructure{
    categories: Category[];
    stages: Stage[];          
    gamerules: GameRule[];        
    scoringRules: ScoreRule[]; 
    timeManagementRule: ITimeManagementRule[]; 
    resourceManagementRule: IResourceManagementRule[] | null; 
    faultsAndPenalties: IFaultsAndPenalties[];
}

interface Timeline{
    timeRegister: Date;
    timeCloseRegister: Date;
    timeStart: Date;
    timeEnd: Date;
}


export interface BaseRule {
    id: string;
    tournamentId: string; // Reference to Tournament
    ruleName: string;
    sport: string[]; // e.g., "pickleball", "tennis"
    slotPlayer: number; // Number of players per slot (e.g., 2 for doubles, 1 for singles)
    description: string;
    feeEntry: number;
    tournamentStructure?: tournamentStructure[];
    timeline: Timeline;
    createdAt: Date;
    updatedAt: Date;
}