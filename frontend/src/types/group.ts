export interface Group{
    id: string;
    name: string;
    bracketId: string | null; // can be null if not set
    sport: string[];
    stageRuleId: string | null;
    teamInGroup: unknown[];
    standings: unknown[];
    status: 'pending' | 'progress' | 'completed';
    createdAt: Date;
    updatedAt: Date;
}
