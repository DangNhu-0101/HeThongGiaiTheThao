import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, UserRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import AuthLayout from "@/components/layout/authLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { canAccessRoles, getManagementPath, getPrimaryRole } from "@/libs/auth";
import { useAuthStore } from "@/stores/useAuthStore";
import { loginSchema, type LoginFormData } from "@/types/auth";
import type { UserRole } from "@/types/user";

export function LoginPage() {
  const { accessToken, user: currentUser, loading, login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { from?: string; requiredRoles?: UserRole[] } | null;
  const canContinue = !state?.requiredRoles?.length ||
    canAccessRoles(currentUser?.roles || [], state.requiredRoles);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  if (accessToken && canContinue) return <Navigate to={state?.from || "/profile"} replace />;

  const onSubmit = async (payload: LoginFormData) => {
    const user = await login(payload);
    if (state?.requiredRoles?.length && !canAccessRoles(user.roles, state.requiredRoles)) {
      toast.error("Tài khoản của bạn chưa có quyền phù hợp để truy cập khu vực này.");
      navigate("/profile", { replace: true });
      return;
    }
    navigate(state?.from || getManagementPath(getPrimaryRole(user.roles)), { replace: true });
  };

  return (
    <AuthLayout>
      <div className="summer-panel rounded-lg p-6 sm:p-10">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-black">Đăng nhập hệ thống</h1>
          <p className="text-sm text-muted-foreground">Tiếp tục quản lý giải đấu, đội thi và lịch thi đấu của bạn.</p>
          {accessToken && !canContinue && (
            <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              Tài khoản hiện tại chưa có vai trò phù hợp. Hãy đăng nhập bằng tài khoản khác.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase text-muted-foreground">Tên đăng nhập</label>
            <div className="relative">
              <UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="h-12 bg-white/80 pl-10" autoComplete="username" {...register("username")} />
            </div>
            {errors.username && <p className="mt-1 text-xs text-red-500">{errors.username.message}</p>}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label className="block text-xs font-bold uppercase text-muted-foreground">Mật khẩu</label>
              <Link to="/forgot-password" className="text-xs font-bold text-primary hover:underline">Quên mật khẩu?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="password" className="h-12 bg-white/80 pl-10" autoComplete="current-password" {...register("password")} />
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <Button disabled={loading} type="submit" className="h-12 w-full text-base font-bold">
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Chưa có tài khoản? <Link to="/register" className="font-bold text-primary hover:underline">Đăng ký</Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
}
