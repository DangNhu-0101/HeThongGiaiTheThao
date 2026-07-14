import { Link, Navigate, useNavigate } from "react-router-dom";
import AuthLayout from "@/components/layout/authLayout";
import { SignupStep1 } from "@/components/auth/SignupStep1";
import { useAuthStore } from "@/stores/useAuthStore";
import type { RegisterFormData } from "@/types/auth";

export function RegisterPage() {
  const { accessToken, loading, register } = useAuthStore();
  const navigate = useNavigate();

  if (accessToken) return <Navigate to="/profile" replace />;

  const handleSubmit = async (data: RegisterFormData) => {
    try {
      await register({
        username: data.username,
        email: data.email,
        phoneNumber: data.phoneNumber,
        password: data.password,
      });
      navigate("/login", { replace: true });
    } catch {
      // Store already shows the toast; keep the form values so the user can correct them.
    }
  };

  return (
    <AuthLayout>
      <div className="summer-panel rounded-lg p-8 sm:p-10">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-black">Tạo tài khoản mới</h1>
          <p className="text-sm text-muted-foreground">Bắt đầu tham gia và quản lý giải đấu trên TMS.</p>
        </div>
        <SignupStep1 onSubmit={handleSubmit} loading={loading} />
        <p className="mt-5 text-center text-xs text-muted-foreground">
          Đã có tài khoản? <Link to="/login" className="font-bold text-primary hover:underline">Đăng nhập</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
