import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail, Phone, UserRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerSchema, type RegisterFormData } from "@/types/auth";

interface Props {
  onSubmit: (data: RegisterFormData) => Promise<void>;
  loading?: boolean;
}

export function SignupStep1({ onSubmit, loading = false }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-[10px] font-bold uppercase text-muted-foreground">Tên đăng nhập</label>
        <div className="relative">
          <UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="h-11 bg-white/80 pl-10" autoComplete="username" {...register("username")} />
        </div>
        {errors.username && <p className="mt-1 text-xs text-red-500">{errors.username.message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase text-muted-foreground">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="email" className="h-11 bg-white/80 pl-10" autoComplete="email" {...register("email")} />
          </div>
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase text-muted-foreground">Số điện thoại</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="tel" className="h-11 bg-white/80 pl-10" autoComplete="tel" {...register("phoneNumber")} />
          </div>
          {errors.phoneNumber && <p className="mt-1 text-xs text-red-500">{errors.phoneNumber.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase text-muted-foreground">Mật khẩu</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="password" className="h-11 bg-white/80 pl-10" autoComplete="new-password" {...register("password")} />
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase text-muted-foreground">Xác nhận mật khẩu</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="password" className="h-11 bg-white/80 pl-10" autoComplete="new-password" {...register("confirmPassword")} />
          </div>
          {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
        </div>
      </div>

      <Button disabled={loading} type="submit" className="h-11 w-full font-bold">
        {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
      </Button>
    </form>
  );
}
