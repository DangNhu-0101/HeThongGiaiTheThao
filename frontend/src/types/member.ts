
export interface Member{
    _id: string;
    teamId : string;
    userId: { _id: string; username: string; email: string; avatar?: string };
    playerid: string;
    role: 'Captain' | 'Member';
    status: 'Invited' | 'Pending' | 'Rejected' | 'Active';
}
