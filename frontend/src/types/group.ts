import type { Standing} from "./standing";
import type { Team } from "./Team";

export interface Group{
    id: string;
    name: string;
    bracketId: string | null; // can be null if not set
    sport: string[];
    stageRuleId: string | null;
    teamInGroup: Team[];
    standings: Standing[];
    status: 'pending' | 'progress' | 'completed';
    createdAt: Date;
    updatedAt: Date;
}