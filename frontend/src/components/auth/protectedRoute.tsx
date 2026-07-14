import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { canAccessRoles } from "@/libs/auth";
import { useAuthStore } from "@/stores/useAuthStore";
import type { UserRole } from "@/types/user";

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { accessToken, user, initialized } = useAuthStore();
  const location = useLocation();

  if (!initialized) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Đang xác thực...</div>;
  }

  if (!accessToken || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!canAccessRoles(user.roles, allowedRoles)) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="summer-panel max-w-md rounded-lg p-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <AlertTriangle className="size-7" />
          </div>
          <h1 className="text-2xl font-black text-foreground">Bạn chưa có quyền truy cập</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Khu vực này dành cho tài khoản có quyền phù hợp. Vui lòng liên hệ ban quản trị nếu bạn cần được cấp thêm quyền.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button render={<Link to="/profile" />}>
              Về hồ sơ của tôi
            </Button>
            <Button render={<Link to="/" />} variant="outline">
              Về trang chủ
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
