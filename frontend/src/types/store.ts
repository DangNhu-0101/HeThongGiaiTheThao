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