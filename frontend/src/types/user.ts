export interface User {
    _id: string;
    email: string;
    username: string;
    phonenumber: string;
    role: "ORGANIZER" | "USER"|"REFEREE";
    avatarUrl?: string;
    createdAt: string;
    updatedAt: string;
}