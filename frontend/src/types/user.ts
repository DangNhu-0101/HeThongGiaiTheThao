import type { Organization } from "./org";
import type { Player } from "./player";
import type { Referee } from "./referee";

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

export interface AuthResponse {
    user: User;
    player?: Player;
    org?: Organization;
    referee?: Referee;
}