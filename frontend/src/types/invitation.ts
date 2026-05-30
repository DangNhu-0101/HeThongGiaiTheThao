export interface Invitation{
    _id: string;
    senderId: { _id: string; username: string };
    receiverId: { _id: string; username: string };
    teamId: { _id: string; name: string },
    status:'pending' | 'accepted' | 'rejected';
    message:string,
    createdAt: string;
    updatedAt: string;
}

