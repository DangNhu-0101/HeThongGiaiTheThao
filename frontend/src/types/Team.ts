

export interface Team {
    id: string;
    name: string;
    logo: string;
    owner: string; // Reference to User ID
    description: string;
    tournamentId: string; // Reference to Tournament
    sportCategory: string; 
    groupId?: string; // Reference to Group (optional, as not all teams may be in a group)
    status: string; // Reference to Category
    createdAt: Date;
    updatedAt: Date;
}