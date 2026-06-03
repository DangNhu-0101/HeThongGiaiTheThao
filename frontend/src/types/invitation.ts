import type { Team } from "./Team";
export interface Invitation{
    _id: string;
    senderId: { _id: string; username: string };
    receiverId: { _id: string; username: string };
    teamId: Team;
    status:'pending' | 'accepted' | 'rejected';
    message:string,
    createdAt: string;
    updatedAt: string;
}

