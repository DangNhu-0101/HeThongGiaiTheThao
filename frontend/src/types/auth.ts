import { z } from "zod";

// ==========================================
// 1. LOGIN (ĐĂNG NHẬP)
// ==========================================
export const loginSchema = z.object({
  username: z.string().min(3, "Tên đăng nhập ít nhất 3 ký tự"),
  password: z.string().min(5, "Mật khẩu ít nhất 5 ký tự"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ==========================================
// 2. SIGNUP STEP 1 (TÀI KHOẢN)
// ==========================================
export const signupStep1Schema = z.object({
  username: z.string().min(3, "Ít nhất 3 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  phoneNumber: z.string().regex(/^\d{10,11}$/, "Số điện thoại gồm 10-11 số"),
  password: z.string().min(5, "Mật khẩu ít nhất 5 ký tự"),
  confirmPassword: z.string(),
  role: z.enum(["player", "org", "referee"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

export type SignupStep1Data = z.infer<typeof signupStep1Schema>;

// ==========================================
// 3. SIGNUP STEP 2 (HỒ SƠ THEO ROLE)
// ==========================================

// 3.1. Dành cho Vận động viên
export const playerSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập họ tên"),
  birthYear: z.number().min(1900, "Năm sinh không hợp lệ").max(new Date().getFullYear()),
  gender: z.enum(["male", "female", "other"]),
  skillLevel: z.number().min(1).max(5),
});
export type PlayerFormData = z.infer<typeof playerSchema>;

// 3.2. Dành cho Ban Tổ Chức
export const orgSchema = z.object({
  orgName: z.string().min(1, "Vui lòng nhập tên tổ chức"),
  address: z.string().min(1, "Vui lòng nhập địa chỉ"),
});
export type OrgFormData = z.infer<typeof orgSchema>;

// 3.3. Dành cho Trọng tài
export const refereeSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập họ tên"),
  birthDay: z.string().min(1, "Vui lòng chọn ngày sinh"),
  gender: z.enum(["male", "female", "other"]),
  experienceYears: z.number().min(0, "Số năm phải lớn hơn hoặc bằng 0"),
});
export type RefereeFormData = z.infer<typeof refereeSchema>;

export interface Props {
  role: "player" | "org" | "referee";
  onSubmit: (data: unknown) => void;
  onBack: () => void;
}