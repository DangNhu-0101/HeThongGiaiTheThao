import type { User, UserRole } from "@/types/user";

export const normalizeRole = (value: unknown): UserRole => {
  if (value === "organizer") return "org";
  if (value === "admin" || value === "org" || value === "referee" || value === "player" || value === "user") {
    return value;
  }
  return "user";
};

export const normalizeUser = (value: unknown): User | null => {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const rawRole = raw.roleName || raw.role || (Array.isArray(raw.roles) ? raw.roles[0] : undefined);

  return {
    _id: String(raw._id || raw.id || ""),
    email: String(raw.email || ""),
    username: String(raw.username || "Tai khoan"),
    phoneNumber: String(raw.phoneNumber || ""),
    role: normalizeRole(typeof rawRole === "object" && rawRole ? (rawRole as Record<string, unknown>).name : rawRole),
    profileData: raw.profileData as User["profileData"],
    createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
    updatedAt: raw.updatedAt ? String(raw.updatedAt) : undefined,
  };
};

export const getRoleLabel = (role?: UserRole | null) => {
  switch (role) {
    case "admin":
      return "quan tri";
    case "org":
      return "to chuc";
    case "referee":
      return "trong tai";
    case "player":
      return "van dong vien";
    default:
      return "tai khoan";
  }
};

export const getManagementPath = (role?: UserRole | null) => {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "org":
      return "/org/dashboard";
    case "referee":
    case "player":
    case "user":
    default:
      return "/profile";
  }
};

export const canAccessRole = (role: UserRole | null | undefined, allowedRoles?: UserRole[]) => {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return Boolean(role && allowedRoles.includes(role));
};
