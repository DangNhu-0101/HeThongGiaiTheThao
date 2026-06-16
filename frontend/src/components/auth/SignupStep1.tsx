import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Mail, Phone, Lock, ShieldQuestion } from "lucide-react";

const step1Schema = z.object({
  username: z.string().min(3, "Ít nhất 3 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  phoneNumber: z.string().regex(/^\d{10,11}$/, "Số điện thoại gồm 10-11 số"),
  password: z.string().min(5, "Mật khẩu ít nhất 5 ký tự"),
  confirmPassword: z.string(),
  role: z.enum(["player", "org", "referee"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

export type Step1Data = z.infer<typeof step1Schema>;

interface Props {
  onSubmit: (data: Step1Data) => void;
  defaultValues?: Partial<Step1Data>;
}

export function SignupStep1({ onSubmit, defaultValues }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<Step1Data>({
    defaultValues: {
      username: defaultValues?.username || '',
      email: defaultValues?.email || '',
      phoneNumber: defaultValues?.phoneNumber || '',
      password: defaultValues?.password || '',
      confirmPassword: defaultValues?.confirmPassword || '',
      role: defaultValues?.role || 'player',
    },
    resolver: zodResolver(step1Schema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
      
      <div>
        <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Tên đăng nhập</label>
        <div className="relative">
          <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input type="text" placeholder="johndoe" className="pl-10 h-11 bg-muted/30 border-border focus:border-primary" {...register("username")} />
        </div>
        {errors.username && <p className="text-[10px] text-red-500 mt-1">{errors.username.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Email</label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input type="email" placeholder="mail@example.com" className="pl-10 h-11 bg-muted/30 border-border focus:border-primary" {...register("email")} />
          </div>
          {errors.email && <p className="text-[10px] text-red-500 mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Số điện thoại</label>
          <div className="relative">
            <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input type="tel" placeholder="0901234567" className="pl-10 h-11 bg-muted/30 border-border focus:border-primary" {...register("phoneNumber")} />
          </div>
          {errors.phoneNumber && <p className="text-[10px] text-red-500 mt-1">{errors.phoneNumber.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Mật khẩu</label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input type="password" placeholder="••••••••" className="pl-10 h-11 bg-muted/30 border-border focus:border-primary" {...register("password")} />
          </div>
          {errors.password && <p className="text-[10px] text-red-500 mt-1">{errors.password.message}</p>}
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Xác nhận mật khẩu</label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input type="password" placeholder="••••••••" className="pl-10 h-11 bg-muted/30 border-border focus:border-primary" {...register("confirmPassword")} />
          </div>
          {errors.confirmPassword && <p className="text-[10px] text-red-500 mt-1">{errors.confirmPassword.message}</p>}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Đăng ký với vai trò</label>
        <div className="relative">
           <ShieldQuestion className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
           <select 
             className="w-full pl-10 pr-4 h-11 border border-border rounded-lg bg-muted/30 text-sm focus:outline-none focus:border-primary appearance-none cursor-pointer"
             {...register("role")}
           >
             <option value="player">Cá nhân / Vận động viên</option>
             <option value="org">Ban Tổ Chức Giải</option>
             <option value="referee">Trọng tài chuyên nghiệp</option>
           </select>
        </div>
      </div>

      <div className="pt-4">
        <Button type="submit" className="w-full h-11 font-bold bg-[#0070c0] hover:bg-[#005b9f]">Tiếp tục ➔</Button>
      </div>
      
      <p className="text-center text-xs text-muted-foreground mt-4">
        Bạn đã có tài khoản? <a href="/login" className="text-primary font-bold hover:underline">Đăng nhập ngay</a>
      </p>
    </form>
  );
}