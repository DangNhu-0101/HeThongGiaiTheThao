
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Calendar, Star, Building2, MapPin, Briefcase } from "lucide-react";
import { orgSchema, playerSchema, refereeSchema, type Props } from "@/types/auth";


export function SignupStep2({ role, onSubmit, onBack }: Props) {
  const schema = role === 'player' ? playerSchema : role === 'org' ? orgSchema : refereeSchema;

  const { register, handleSubmit, formState: { errors } } = useForm<any>({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4">
         <p className="text-xs text-primary font-medium text-center">
           Hoàn thiện thông tin hồ sơ {role === 'player' ? 'Vận động viên' : role === 'org' ? 'Tổ chức' : 'Trọng tài'}
         </p>
      </div>

      {/* --- FORM VẬN ĐỘNG VIÊN --- */}
      {role === 'player' && (
        <>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Họ và Tên</label>
            <div className="relative">
               <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
               <Input type="text" placeholder="Nguyễn Văn A" className="pl-10 h-11 bg-muted/30 border-border" {...register("name")} />
            </div>
            {errors.name && <p className="text-[10px] text-red-500 mt-1">{errors.name.message as string}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Năm sinh</label>
              <div className="relative">
                 <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                 <Input type="number" placeholder="2000" className="pl-10 h-11 bg-muted/30 border-border" {...register("birthYear", { valueAsNumber: true })} />
              </div>
              {errors.birthYear && <p className="text-[10px] text-red-500 mt-1">{errors.birthYear.message as string}</p>}
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Giới tính</label>
              <select className="w-full px-3 h-11 border border-border rounded-lg bg-muted/30 text-sm focus:outline-none focus:border-primary" {...register("gender")}>
                <option value="male">Nam</option><option value="female">Nữ</option><option value="other">Khác</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Trình độ kỹ năng (1.0 - 5.0)</label>
            <div className="relative">
               <Star className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
               <Input type="number" step="0.5" placeholder="Ví dụ: 3.5" className="pl-10 h-11 bg-muted/30 border-border" {...register("skillLevel", { valueAsNumber: true })} />
            </div>
            {errors.skillLevel && <p className="text-[10px] text-red-500 mt-1">{errors.skillLevel.message as string}</p>}
          </div>
        </>
      )}

      {/* --- FORM TỔ CHỨC --- */}
      {role === 'org' && (
        <>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Tên Tổ Chức / Doanh nghiệp</label>
            <div className="relative">
               <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
               <Input type="text" placeholder="Công ty TNHH Thể Thao..." className="pl-10 h-11 bg-muted/30 border-border" {...register("orgName")} />
            </div>
            {errors.orgName && <p className="text-[10px] text-red-500 mt-1">{errors.orgName.message as string}</p>}
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Địa chỉ trụ sở</label>
            <div className="relative">
               <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
               <Input type="text" placeholder="Số nhà, Tên đường, Tỉnh/Thành..." className="pl-10 h-11 bg-muted/30 border-border" {...register("address")} />
            </div>
            {errors.address && <p className="text-[10px] text-red-500 mt-1">{errors.address.message as string}</p>}
          </div>
        </>
      )}

      {/* --- FORM TRỌNG TÀI --- */}
      {role === 'referee' && (
        <>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Họ và Tên</label>
            <div className="relative">
               <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
               <Input type="text" placeholder="Trần Trọng Tài" className="pl-10 h-11 bg-muted/30 border-border" {...register("name")} />
            </div>
            {errors.name && <p className="text-[10px] text-red-500 mt-1">{errors.name.message as string}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Ngày sinh</label>
              <Input type="date" className="h-11 bg-muted/30 border-border px-3" {...register("birthDay")} />
              {errors.birthDay && <p className="text-[10px] text-red-500 mt-1">{errors.birthDay.message as string}</p>}
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Giới tính</label>
              <select className="w-full px-3 h-11 border border-border rounded-lg bg-muted/30 text-sm focus:outline-none focus:border-primary" {...register("gender")}>
                <option value="male">Nam</option><option value="female">Nữ</option><option value="other">Khác</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Số năm kinh nghiệm</label>
            <div className="relative">
               <Briefcase className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
               <Input type="number" placeholder="5" className="pl-10 h-11 bg-muted/30 border-border" {...register("experienceYears", { valueAsNumber: true })} />
            </div>
            {errors.experienceYears && <p className="text-[10px] text-red-500 mt-1">{errors.experienceYears.message as string}</p>}
          </div>
        </>
      )}

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onBack} className="w-1/3 h-11 font-bold">Trở lại</Button>
        <Button type="submit" className="flex-1 h-11 font-bold bg-[#0070c0] hover:bg-[#005b9f]">Hoàn tất Đăng ký ✓</Button>
      </div>

    </form>
  );
}
