import { create } from "zustand";
import { toast } from "sonner";
import {
  clearStoredSession,
  mergeUser,
  normalizeUser,
  persistSession,
  readStoredAccessToken,
  readStoredUser,
} from "@/libs/auth";
import { getApiErrorMessage, getApiErrorStatus } from "@/libs/axios";
import { authService } from "@/services/authService";
import type { AuthState } from "@/types/store";
import type { User } from "@/types/user";

const requireUser = (value: unknown): User => {
  const user = normalizeUser(value);
  if (!user) throw new Error("Không tìm thấy thông tin tài khoản hợp lệ");
  return user;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: readStoredAccessToken(),
  user: readStoredUser(),
  loading: false,
  initialized: false,
  error: null,

  clearSession: () => {
    clearStoredSession();
    set({ accessToken: null, user: null, loading: false, initialized: true, error: null });
  },

  setCurrentUser: (user) => {
    const accessToken = get().accessToken;
    const merged = mergeUser(get().user, user);
    if (accessToken) persistSession(accessToken, merged);
    set({ user: merged, error: null });
  },

  restoreSession: async () => {
    const accessToken = readStoredAccessToken();
    const storedUser = readStoredUser();
    if (!accessToken) {
      get().clearSession();
      return;
    }

    set({ accessToken, user: storedUser, loading: true, error: null });
    try {
      const apiUser = await authService.getCurrentUser();
      const user = requireUser(apiUser);
      persistSession(accessToken, user);
      set({ user, initialized: true });
    } catch (error) {
      if ([401, 403].includes(getApiErrorStatus(error) || 0)) {
        get().clearSession();
        return;
      }
      // /api/users chưa được mount trong server.js hiện tại.
      // Giữ session local hợp lệ thay vì đăng xuất cưỡng bức khi endpoint trả 404.
      set({ user: storedUser, initialized: true });
    } finally {
      set({ loading: false });
    }
  },

  register: async (payload) => {
    set({ loading: true, error: null });
    try {
      const response = await authService.register(payload);
      const registeredUser = requireUser(response.user);
      if (response.accessToken) {
        persistSession(response.accessToken, registeredUser);
        set({ accessToken: response.accessToken, user: registeredUser, initialized: true });
      } else {
        clearStoredSession();
        set({ accessToken: null, user: null, initialized: true });
      }
      toast.success("Tạo tài khoản thành công. Vui lòng đăng nhập để tiếp tục.");
      return registeredUser;
    } catch (error) {
      const message = getApiErrorMessage(error, "Đăng ký thất bại");
      set({ error: message });
      toast.error(message);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  login: async (payload) => {
    set({ loading: true, error: null });
    try {
      const response = await authService.login(payload);
      const loginUser = requireUser(response.user);
      let user = loginUser;
      if (!response.accessToken) throw new Error("Không nhận được thông tin xác thực.");
      persistSession(response.accessToken, loginUser);

      // Login BE chỉ trả username + mảng role ObjectId. Nếu /users/me được mount,
      // response này bổ sung email, phoneNumber và tên role đã populate.
      try {
        user = mergeUser(loginUser, requireUser(await authService.getCurrentUser()));
      } catch {
        user = loginUser;
      }

      persistSession(response.accessToken, user);
      set({ accessToken: response.accessToken, user, initialized: true });
      toast.success("Đăng nhập thành công");
      return user;
    } catch (error) {
      const message = getApiErrorMessage(error, "Đăng nhập thất bại");
      set({ error: message });
      toast.error(message);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  refreshCurrentUser: async () => {
    const accessToken = get().accessToken;
    if (!accessToken) return null;
    try {
      const user = mergeUser(get().user, requireUser(await authService.getCurrentUser()));
      persistSession(accessToken, user);
      set({ user, error: null });
      return user;
    } catch (error) {
      if ([401, 403].includes(getApiErrorStatus(error) || 0)) {
        get().clearSession();
        return null;
      }
      set({ error: getApiErrorMessage(error, "Không thể tải lại thông tin tài khoản") });
      return get().user;
    }
  },

  registerRoleProfile: async (role, payload) => {
    set({ loading: true, error: null });
    try {
      await authService.registerRoleProfile(role, payload);
      await get().refreshCurrentUser();
      toast.success("Đã cập nhật hồ sơ vai trò");
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "Chưa thể gửi yêu cầu đăng ký vai trò lúc này",
      );
      set({ error: message });
      toast.error(message);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    set({ loading: true, error: null });
    try {
      await authService.logout();
    } catch (error) {
      console.warn("Không thể kết thúc phiên đăng nhập trên máy chủ, phiên trên thiết bị vẫn được xóa.", error);
    } finally {
      get().clearSession();
      toast.success("Đăng xuất thành công");
    }
  },
}));
