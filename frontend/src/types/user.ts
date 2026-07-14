export type BackendRoleName = "player" | "coach" | "referee" | "org" | "organization" | "admin";
export type UserRole = BackendRoleName | "user";
export type UserStatus = "actived" | "inactive" | "banned";
export type ProfileStatus = "pending" | "actived" | "active" | "approved" | "rejected" | "inactive";

export interface LinkedProfile {
  _id?: string;
  id?: string;
  type?: "player" | "organization" | "org" | "referee";
  name?: string;
  birthDate?: string;
  gender?: "male" | "female" | "other";
  status?: ProfileStatus;
  skill?: number;
  sports?: Array<{ category?: string; level?: string; position?: string; yearsOfExperience?: number }>;
  address?: { city?: string; district?: string; detail?: string } | string;
  contactEmail?: string;
  contactPhone?: string;
  phoneNumber?: string;
  [key: string]: unknown;
}

export interface ApiRole {
  _id?: string;
  name?: BackendRoleName;
}

export type ApiRoleValue = string | ApiRole;

/**
 * Hợp nhất các shape BE hiện trả:
 * - register: { username, email, phoneNumber, role: "player" }
 * - login: { id, username, role: ObjectId[] }
 * - /users/me: user đầy đủ, roles đã populate thành object.
 */
export interface ApiUser {
  _id?: string;
  id?: string;
  username?: string;
  email?: string;
  phoneNumber?: string;
  avatar?: string;
  status?: UserStatus;
  role?: ApiRoleValue | ApiRoleValue[];
  roles?: ApiRoleValue[];
  roleIds?: string[];
  profile?: LinkedProfile | null;
  playerProfile?: LinkedProfile | null;
  player?: LinkedProfile | null;
  organizationProfile?: LinkedProfile | null;
  organization?: LinkedProfile | null;
  refereeProfile?: LinkedProfile | null;
  referee?: LinkedProfile | null;
  profiles?: LinkedProfile[];
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisterApiUser extends ApiUser {
  username: string;
  email: string;
  phoneNumber: string;
  role: ApiRoleValue;
}

export interface LoginApiUser extends ApiUser {
  id: string;
  username: string;
  role: ApiRoleValue[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  phoneNumber: string;
  avatar: string;
  status: UserStatus;
  roles: UserRole[];
  roleIds: string[];
  profile?: LinkedProfile | null;
  playerProfile?: LinkedProfile | null;
  player?: LinkedProfile | null;
  organizationProfile?: LinkedProfile | null;
  organization?: LinkedProfile | null;
  refereeProfile?: LinkedProfile | null;
  referee?: LinkedProfile | null;
  profiles?: LinkedProfile[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UserApiResponse {
  success?: boolean;
  message?: string;
  user?: ApiUser;
  data?: ApiUser;
}
