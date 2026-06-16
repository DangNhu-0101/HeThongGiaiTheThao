import { canAccessRole } from "@/libs/auth";
import { useAuthStore } from "@/stores/useAuthStore";
import type { UserRole } from "@/types/user";
import { Navigate, Outlet } from "react-router-dom";

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { accessToken, user } = useAuthStore();

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  if (!canAccessRole(user?.role, allowedRoles)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
