import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";

type ProtectedRouteProps = {
  allowedRoles?: string[];
};

const normalizeRole = (role?: string) => role?.toLowerCase();

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { accessToken, authUser: user, loading } = useAuthStore();

  if (loading) {
    return <div className="p-6 text-slate-500">Đang tải dữ liệu...</div>;
  }

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  const userRole = normalizeRole(user?.role);
  const normalizedAllowedRoles = allowedRoles?.map(normalizeRole);

  if (normalizedAllowedRoles?.length && (!userRole || !normalizedAllowedRoles.includes(userRole))) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
