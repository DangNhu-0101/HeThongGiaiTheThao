import api from "../libs/axios";
import { clearStoredAuthTokens } from "@/utils/authToken";

export const authService = {
  register: async (
    email: string,
    password: string,
    username: string,
    phoneNumber: string,
    role: string,
    profileData: unknown
  ) => {
    try {
      const res = await api.post("/auth/register", { email, password, username, phoneNumber, role, profileData });
      return res.data;
    } catch (err) {
      console.log(err);
      throw new Error("Đăng ký thất bại", { cause: err });
    }
  },

  login: async (username: string, password: string) => {
    try {
      const res = await api.post("/auth/login", { username, password });
      return res.data;
    } catch (err) {
      console.log(err);
      throw new Error("Đăng nhập thất bại", { cause: err });
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
      clearStoredAuthTokens();
    } catch (err) {
      console.log(err);
      throw new Error("Đăng xuất thất bại", { cause: err });
    }
  },
};
