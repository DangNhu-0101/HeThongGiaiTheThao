import type { Group } from "./group";


export interface Bracket {
    id: string;
    name: string;
    tournamentId: string; // Reference to Tournament
    stageId: string; // Reference to Stage
    sport: string; // Type of sport (e.g., "pickleball", "tennis")
    categoryId: string; // Reference to Category
    numberOfGroups: number;
    groups: Group[]; // Array of groups in the bracket
    createdAt: Date;
    updatedAt: Date;
}