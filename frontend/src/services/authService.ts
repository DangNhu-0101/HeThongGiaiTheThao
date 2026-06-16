import api from "../libs/axios";

export const authService = {
  register: async (
    email: string,
    password: string,
    username: string,
    phoneNumber: string,
    role: string,
    profileData: unknown,
  ) => {
    try {
      const res = await api.post("/auth/register", {
        email,
        password,
        username,
        phoneNumber,
        role,
        profileData,
      });

      if (res.data?.accessToken) {
        localStorage.setItem("accessToken", res.data.accessToken);
      }

      return res.data;
    } catch (err) {
      console.log(err);
      throw new Error("Dang ky that bai");
    }
  },

  login: async (username: string, password: string) => {
    try {
      const res = await api.post("/auth/login", { username, password });

      if (res.data?.accessToken) {
        localStorage.setItem("accessToken", res.data.accessToken);
      }

      return res.data;
    } catch (err) {
      console.log(err);
      throw new Error("Dang nhap that bai");
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("token");
      localStorage.removeItem("authUser");
    } catch (err) {
      console.log(err);
      throw new Error("Dang xuat that bai");
    }
  },
};
