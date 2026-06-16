
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Mail, RectangleGoggles, Shapes, ShieldAlert } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNavigate } from "react-router-dom";
import AuthLayout from "@/components/layout/authLayout";
import { getManagementPath } from "@/libs/auth";

const loginSchema = z.object({
  username: z.string().min(3, "Tên đăng nhập ít nhất 3 ký tự"),
  password: z.string().min(5, "Mật khẩu ít nhất 5 ký tự"),
});
type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  
  // KIỂU DỮ LIỆU ĐÃ ĐƯỢC CHUẨN HÓA TRONG HOOK FORM:
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });
  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.username, data.password);
      const role = useAuthStore.getState().user?.role;
      navigate(getManagementPath(role));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AuthLayout>
      <div className="bg-card border border-border rounded-3xl shadow-xl overflow-hidden p-8 sm:p-10">
        
        {/* Header Form */}
        <div className="mb-8">
       
          <h2 className="text-3xl font-black text-foreground mb-2">Đăng nhập hệ thống</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Vui lòng đăng nhập bằng tài khoản Ban tổ chức được cấp phép.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block">Tên đăng nhập / Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input id="username" type="text" placeholder="bantochuc@example.com" className="pl-10 h-12 bg-muted/30 border-border focus:border-primary" {...register("username")} />
            </div>
            {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block">Mật khẩu</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input id="password" type="password" placeholder="Nhập mật khẩu của bạn" className="pl-10 h-12 bg-muted/30 border-border focus:border-primary" {...register("password")} />
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded text-primary border-border focus:ring-primary w-4 h-4" />
              <span className="text-foreground font-medium">Ghi nhớ đăng nhập</span>
            </label>
            <a href="/forgot-password" className="text-primary font-bold hover:underline">Quên mật khẩu?</a>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-base font-bold bg-[#0070c0] hover:bg-[#005b9f] shadow-lg shadow-blue-500/30">
            {isSubmitting ? "Đang đăng nhập..." : "➔ Đăng nhập hệ thống"}
          </Button>
          
          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink-0 mx-4 text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Hoặc</span>
            <div className="flex-grow border-t border-border"></div>
          </div>

          <Button type="button" variant="outline" className="w-full h-12 text-foreground font-bold border-border bg-muted/20 hover:bg-muted/50">
            <RectangleGoggles className="w-4 h-4 mr-2 text-muted-foreground" /> Đăng nhập bằng Google
          </Button>

        

          <p className="text-center text-xs text-muted-foreground mt-6">
            Chưa có tài khoản? <a href="/register" className="text-primary font-bold hover:underline">Đăng ký </a>ngay!
          </p>
        </form>
      </div>
    </AuthLayout>
  );
}
