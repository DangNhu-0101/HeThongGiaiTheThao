import type { Member } from "./member";

export interface Team {
    _id: string;
    name: string;
    logo: string;
    owner: string; // Reference to User ID
    description: string;
    tournamentId: { name: string; paymentQR?: string };
    sportCategory: string; 
    groupId?: string; // Reference to Group (optional, as not all teams may be in a group)
    status: 'pending' | 'validated' | 'confirmed';
    createdAt: Date;
    updatedAt: Date;
    isPaid: boolean;
    members: Member[];

}

