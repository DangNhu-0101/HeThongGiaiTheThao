export interface Notification{
    _id: string;
    userId: string;
    type: string;
    title:string;

    message:string;
    metadata:{
        teamId:string,
        tournamentId:string,
        amount:string,
        paymentQR:string,
        paymentContent:string,
        invitedBy:string
    };

    isRead: boolean;
    createdAt: string;
    updatedAt: string;
}