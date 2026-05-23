export interface GameRule {
    id: string;
    tournamentId?: string; // Reference to Tournament
    baseRules?: string; // Base rules for the tournament
    sport: string[]; 
    RuleName: string; // Type of sport (e.g., "pickleball", "tennis")
    description: string;
    config: any; // Additional configuration specific to the sport
    createdAt: Date;
    updatedAt: Date;
}