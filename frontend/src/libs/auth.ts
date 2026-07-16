import type { ApiRoleValue, ApiUser, BackendRoleName, User, UserRole } from "@/types/user";

export const ACCESS_TOKEN_STORAGE_KEY = "accessToken";
export const AUTH_USER_STORAGE_KEY = "authUser";

const ROLE_PRIORITY: UserRole[] = ["admin", "org", "organization", "referee", "coach", "player", "user"];
const BACKEND_ROLE_NAMES: BackendRoleName[] = ["admin", "org", "organization", "referee", "coach", "player"];

const normalizeRoleName = (value: unknown): UserRole | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "administrator" || normalized === "superadmin" || normalized === "super-admin") return "admin";
  if (normalized === "organizer") return "organization";
  if (normalized === "athlete") return "player";
  if (BACKEND_ROLE_NAMES.includes(normalized as BackendRoleName)) return normalized as BackendRoleName;
  if (normalized === "user") return "user";
  return null;
};

const asRoleValues = (raw: ApiUser): ApiRoleValue[] => {
  if (Array.isArray(raw.roles)) return raw.roles;
  if (Array.isArray(raw.role)) return raw.role;
  if (raw.role !== undefined) return [raw.role];
  return [];
};

const readConfiguredRoleIds = (): Partial<Record<BackendRoleName, string>> => ({
  admin: import.meta.env.VITE_ADMIN_ROLE_ID,
  org: import.meta.env.VITE_ORG_ROLE_ID || import.meta.env.VITE_ORGANIZATION_ROLE_ID,
  organization: import.meta.env.VITE_ORGANIZATION_ROLE_ID,
  referee: import.meta.env.VITE_REFEREE_ROLE_ID,
  coach: import.meta.env.VITE_COACH_ROLE_ID,
  player: import.meta.env.VITE_PLAYER_ROLE_ID,
});

const normalizeRoles = (raw: ApiUser): { roles: UserRole[]; roleIds: string[] } => {
  const values = asRoleValues(raw);
  const roles = new Set<UserRole>();
  const roleIds: string[] = Array.isArray(raw.roleIds) ? raw.roleIds.map(String) : [];

  values.forEach((value) => {
    if (typeof value === "string") {
      const normalizedRole = normalizeRoleName(value);
      if (normalizedRole && normalizedRole !== "user") roles.add(normalizedRole);
      else roleIds.push(value);
      return;
    }
    if (value && typeof value === "object") {
      const normalizedRole = normalizeRoleName(value.name);
      if (normalizedRole && normalizedRole !== "user") roles.add(normalizedRole);
      if (value._id) roleIds.push(String(value._id));
    }
  });

  const configuredIds = readConfiguredRoleIds();
  BACKEND_ROLE_NAMES.forEach((role) => {
    const configuredId = configuredIds[role];
    if (configuredId && roleIds.includes(configuredId)) roles.add(role);
  });

  if (roles.size === 0 && roleIds.length >= BACKEND_ROLE_NAMES.length) roles.add("admin");
  if (roles.size === 0) roles.add("user");

  return {
    roles: ROLE_PRIORITY.filter((role) => roles.has(role)),
    roleIds: [...new Set(roleIds)],
  };
};

export const normalizeUser = (value: unknown): User | null => {
  if (!value || typeof value !== "object") return null;
  const raw = value as ApiUser;
  const { roles, roleIds } = normalizeRoles(raw);

  return {
    id: String(raw._id || raw.id || ""),
    username: String(raw.username || "Tài khoản"),
    email: String(raw.email || ""),
    phoneNumber: String(raw.phoneNumber || ""),
    avatar: String(raw.avatar || ""),
    fullName: raw.fullName,
    birthDate: raw.birthDate,
    gender: raw.gender,
    address: raw.address,
    bio: raw.bio,
    isDefaultGenerated: raw.isDefaultGenerated,
    mustChangePassword: raw.mustChangePassword,
    status: raw.status || "actived",
    roles,
    roleIds,
    profile: raw.profile,
    playerProfile: raw.playerProfile,
    player: raw.player,
    organizationProfile: raw.organizationProfile,
    organization: raw.organization,
    refereeProfile: raw.refereeProfile,
    referee: raw.referee,
    profiles: raw.profiles,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
};

export const mergeUser = (current: User | null, incoming: User): User => {
  const merged = {
    ...current,
    ...incoming,
    id: incoming.id || current?.id || "",
    username: incoming.username || current?.username || "Tài khoản",
    email: incoming.email || current?.email || "",
    phoneNumber: incoming.phoneNumber || current?.phoneNumber || "",
    avatar: incoming.avatar || current?.avatar || "",
    fullName: incoming.fullName ?? current?.fullName,
    birthDate: incoming.birthDate ?? current?.birthDate,
    gender: incoming.gender ?? current?.gender,
    address: incoming.address ?? current?.address,
    bio: incoming.bio ?? current?.bio,
    isDefaultGenerated: incoming.isDefaultGenerated ?? current?.isDefaultGenerated,
    mustChangePassword: incoming.mustChangePassword ?? current?.mustChangePassword,
    roles: incoming.roles.includes("user") && current?.roles.length ? current.roles : incoming.roles,
    roleIds: incoming.roleIds.length ? incoming.roleIds : current?.roleIds || [],
  };

  return {
    ...merged,
    profile: incoming.profile !== undefined ? incoming.profile : current?.profile,
    playerProfile: incoming.playerProfile !== undefined ? incoming.playerProfile : current?.playerProfile,
    player: incoming.player !== undefined ? incoming.player : current?.player,
    organizationProfile: incoming.organizationProfile !== undefined ? incoming.organizationProfile : current?.organizationProfile,
    organization: incoming.organization !== undefined ? incoming.organization : current?.organization,
    refereeProfile: incoming.refereeProfile !== undefined ? incoming.refereeProfile : current?.refereeProfile,
    referee: incoming.referee !== undefined ? incoming.referee : current?.referee,
    profiles: incoming.profiles !== undefined ? incoming.profiles : current?.profiles,
  };
};

export const readStoredUser = (): User | null => {
  const serialized = localStorage.getItem(AUTH_USER_STORAGE_KEY);
  if (!serialized || serialized === "null" || serialized === "undefined") return null;
  try {
    return normalizeUser(JSON.parse(serialized));
  } catch {
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    return null;
  }
};

export const readStoredAccessToken = (): string | null => {
  const token = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  return token && token !== "null" && token !== "undefined" ? token : null;
};

export const persistSession = (accessToken: string, user: User) => {
  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
  localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
  localStorage.removeItem("token");
};

export const clearStoredSession = () => {
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  localStorage.removeItem("token");
};

export const getPrimaryRole = (roles?: UserRole[] | null): UserRole =>
  ROLE_PRIORITY.find((role) => roles?.includes(role)) ?? "user";

export const getRoleLabel = (role?: UserRole | null) => {
  switch (role) {
    case "admin": return "Quản trị viên";
    case "org":
    case "organization": return "Ban tổ chức";
    case "referee": return "Trọng tài";
    case "coach": return "Huấn luyện viên";
    case "player": return "Vận động viên";
    default: return "Tài khoản";
  }
};

export const getManagementPath = (role?: UserRole | null) => {
  if (role === "admin") return "/admin/dashboard";
  if (role === "org" || role === "organization") return "/org/dashboard";
  return "/profile";
};

export const canAccessRoles = (userRoles: UserRole[], allowedRoles?: UserRole[]) => {
  if (!allowedRoles?.length) return true;
  return allowedRoles.some((role) => userRoles.includes(role));
};

export const ORGANIZER_ROLES: UserRole[] = ["org", "organization", "admin"];

export const canManageTournaments = (roles?: UserRole[] | null) =>
  canAccessRoles(roles || [], ORGANIZER_ROLES);
