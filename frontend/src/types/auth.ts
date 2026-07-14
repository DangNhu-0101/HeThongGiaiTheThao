import { z } from "zod";
import type { ApiUser, User } from "./user";

export const loginSchema = z.object({
  username: z.string().trim().min(3, "Tên đăng nhập ít nhất 3 ký tự"),
  password: z.string().min(5, "Mật khẩu ít nhất 5 ký tự"),
});

export const registerSchema = z.object({
  username: z.string().trim().min(3, "Tên đăng nhập ít nhất 3 ký tự"),
  email: z.string().trim().email("Email không hợp lệ"),
  phoneNumber: z.string().trim().regex(/^\d{10,11}$/, "Số điện thoại gồm 10-11 số"),
  password: z.string().min(5, "Mật khẩu ít nhất 5 ký tự"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  phoneNumber: string;
}

export interface AuthApiResponse<TUser extends ApiUser = ApiUser> {
  message: string;
  accessToken?: string;
  user?: TUser;
}

export interface AuthSession {
  accessToken: string;
  user: User;
}

export type ProfileRole = "organization" | "player" | "referee";

export interface OrganizationProfilePayload {
  name: string;
  logo?: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: {
    city?: string;
    district?: string;
    detail?: string;
  };
}

export interface PlayerProfilePayload {
  name: string;
  birthDate: string;
  gender: "male" | "female" | "other";
  skill: number;
  sports?: Array<{
    category?: string;
    level?: string;
    position?: string;
  }>;
}

export interface RefereeProfilePayload {
  name: string;
  birthDate: string;
  gender: "male" | "female" | "other";
  phoneNumber?: string;
  sports?: Array<{
    category?: string;
    yearsOfExperience?: number;
  }>;
}

export type RoleProfilePayload =
  | OrganizationProfilePayload
  | PlayerProfilePayload
  | RefereeProfilePayload;
