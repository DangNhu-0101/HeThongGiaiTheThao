import api from "../libs/axios";

export const authService = {
    register: async (email: string, password: string, username: string, phonenumber: string, role: string, profileData: unknown) => {
        try {
            const res = await api.post("/auth/register", { email, password, username, phonenumber, role, profileData });
            return res.data;
        } catch (err) {
            console.log(err);
            throw new Error("Đăng ký thất bại");
        }
    },

    login : async (email: string, password: string) => {
        try {
            const res = await api.post("/auth/login", { email, password });
            return res.data;
        } catch (err) {
            console.log(err);
            throw new Error("Đăng nhập thất bại");
        }
    },

    logout: async () => {
        try {
            await api.post("/auth/logout");
            localStorage.removeItem("accessToken");
        } catch (err) {
            console.log(err);
            throw new Error("Đăng xuất thất bại");
        }
    },
}