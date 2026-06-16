import { create } from "zustand";
import { toast } from "sonner";
import { authService } from "../services/authService";
import { normalizeUser } from "@/libs/auth";
import type { AuthState } from "../types/store";
import type { User, UserProfile } from "../types/user";

const storedToken = localStorage.getItem("accessToken") || localStorage.getItem("token");
const storedUser = normalizeUser(localStorage.getItem("authUser") ? JSON.parse(localStorage.getItem("authUser") || "{}") : null);

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: storedToken,
  user: storedUser,
  loading: false,

  clearState: () => {
    localStorage.removeItem("authUser");
    set({ accessToken: null, user: null, loading: false });
  },

  register: async (
    email: string,
    password: string,
    username: string,
    phoneNumber: string,
    role: "admin" | "organizer" | "org" | "referee" | "player" | "user",
    profileData: UserProfile,
  ) => {
    try {
      set({ loading: true });
      const data = await authService.register(email, password, username, phoneNumber, role, profileData);
      const user = normalizeUser(data.user);
      if (user) localStorage.setItem("authUser", JSON.stringify(user));
      set({
        accessToken: data.accessToken || localStorage.getItem("accessToken"),
        user: user as User | null,
      });
      toast.success("Dang ky thanh cong");
    } catch (err) {
      console.log(err);
      toast.error("Dang ky that bai");
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  login: async (username: string, password: string) => {
    try {
      set({ loading: true });
      const data = await authService.login(username, password);
      const user = normalizeUser(data.user);
      if (user) localStorage.setItem("authUser", JSON.stringify(user));
      set({
        accessToken: data.accessToken || localStorage.getItem("accessToken"),
        user: user as User | null,
      });
      toast.success("Dang nhap thanh cong");
    } catch (err) {
      console.log(err);
      toast.error("Dang nhap that bai");
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    try {
      get().clearState();
      await authService.logout();
      toast.success("Dang xuat thanh cong");
    } catch (err) {
      console.log(err);
      toast.error("Dang xuat that bai");
      throw err;
    } finally {
      set({ loading: false });
    }
  },
}));
