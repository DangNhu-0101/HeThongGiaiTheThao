import api from "@/libs/axios";
import type {
  AuthApiResponse,
  LoginRequest,
  ProfileRole,
  RegisterRequest,
  RoleProfilePayload,
} from "@/types/auth";
import type {
  ApiUser,
  LoginApiUser,
  RegisterApiUser,
  UserApiResponse,
} from "@/types/user";

const profileEndpoint: Record<ProfileRole, string> = {
  organization: "/users/request-role",
  player: "/users/create-player",
  referee: "/users/request-role",
};

export const authService = {
  async register(payload: RegisterRequest): Promise<AuthApiResponse<RegisterApiUser>> {
    const response = await api.post<AuthApiResponse<RegisterApiUser>>("/auth/register", payload);
    return {
      ...response.data,
      user: response.data.user || {
        username: payload.username,
        email: payload.email,
        phoneNumber: payload.phoneNumber,
        role: "player",
      },
    };
  },

  async login(payload: LoginRequest): Promise<AuthApiResponse<LoginApiUser>> {
    const response = await api.post<AuthApiResponse<LoginApiUser>>("/auth/login", payload);
    
    return response.data;
  },

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>("/auth/forgot-password/request", { email });
    return response.data;
  },

  async verifyPasswordReset(email: string, code: string): Promise<{ message: string; resetToken: string }> {
    const response = await api.post<{ message: string; resetToken: string }>("/auth/forgot-password/verify", { email, code });
    return response.data;
  },

  async resetPassword(resetToken: string, newPassword: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>("/auth/forgot-password/reset", { resetToken, newPassword });
    return response.data;
  },

  async requestChangePasswordOtp(): Promise<{ message: string; expiresInSeconds: number; resendAfterSeconds: number }> {
    const response = await api.post<{ message: string; expiresInSeconds: number; resendAfterSeconds: number }>("/users/change-password/request-otp");
    return response.data;
  },

  async verifyChangePasswordOtp(code: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>("/users/change-password/verify-otp", { code });
    return response.data;
  },

  async confirmChangePassword(code: string, newPassword: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>("/users/change-password/confirm", { code, newPassword });
    return response.data;
  },

  async getCurrentUser(): Promise<ApiUser> {
    try {
      const response = await api.get<UserApiResponse>("/users/me");
      const user = response.data.user || response.data.data;
      if (!user) throw new Error("Không tìm thấy thông tin tài khoản");
      try {
        const profileUser = await this.getProfile();
        const {
          profile,
          playerProfile,
          player,
          organizationProfile,
          organization,
          refereeProfile,
          referee,
          profiles,
        } = profileUser;
        return {
          ...user,
          profile,
          playerProfile,
          player,
          organizationProfile,
          organization,
          refereeProfile,
          referee,
          profiles,
        };
      } catch {
        return user;
      }
    } catch (meError) {
      try {
        return await this.getProfile();
      } catch {
        throw meError;
      }
    }
  },

  async getProfile(): Promise<ApiUser> {
    const response = await api.get<UserApiResponse>("/users/profile");
    const user = response.data.data || response.data.user;
    if (!user) throw new Error("Chưa có hồ sơ người dùng");
    return user;
  },

  async updateProfile(payload: Partial<Pick<ApiUser, "username" | "email" | "phoneNumber" | "avatar" | "fullName" | "birthDate" | "gender" | "address" | "bio">>): Promise<ApiUser> {
    const response = await api.put<UserApiResponse>("/users/profile", payload);
    const user = response.data.data || response.data.user;
    if (!user) throw new Error("Không thể đọc hồ sơ sau khi cập nhật");
    return user;
  },

  async registerRoleProfile(role: ProfileRole, payload: RoleProfilePayload): Promise<void> {
    if (role === "organization" || role === "referee") {
      await api.post(profileEndpoint[role], {
        roleType: role === "organization" ? "org" : "referee",
        profileData: payload,
      });
      return;
    }
    await api.post(profileEndpoint[role], payload);
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");
  },
};
