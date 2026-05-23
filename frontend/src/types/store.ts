import type { BaseRule } from "./baseRule";
import type { Tournament } from "./tournament";
import type {User} from "./user"

export interface AuthState {
    accessToken: string | null;
    user: User | null; // Có thể thay đổi thành kiểu dữ liệu cụ thể hơn nếu có
    loading: boolean;

    clearState: () => void;
    register: (email: string, password: string, username: string, phonenumber: string, role: string, profileData: any) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

export interface TournamentState {
    accessToken: string | null;
    tournament: Tournament | null; 
    baseRule: BaseRule | null;// Có thể thay đổi thành kiểu dữ liệu cụ thể hơn nếu có
    loading: boolean;
}