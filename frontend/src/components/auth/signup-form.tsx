import { cn } from "@/libs/utils";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const step1Schema = z.object({
  username: z.string().min(3, "Ít nhất 3 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  phoneNumber: z.string().regex(/^\d{10,11}$/, "Số điện thoại 10-11 số"),
  password: z.string().min(8, "Mật khẩu ít nhất 8 ký tự"),
  confirmPassword: z.string(),
  role: z.enum(["player", "org", "referee"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",

});

type Step1Data = z.infer<typeof step1Schema>;



// ... imports

export function SignupStep1({ onSubmit, defaultValues }: { onSubmit: (data: Step1Data) => void; defaultValues?: any }) {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<Step1Data>({
    defaultValues: {
      username: defaultValues?.username || '',
      email: defaultValues?.email || '',
      phoneNumber: defaultValues?.phoneNumber || '',
      password: defaultValues?.password || '',
      confirmPassword: '', // không nên set bằng password
      role: defaultValues?.role || 'player',
    },
    resolver: zodResolver(step1Schema),
  });

  const onValid = (data: Step1Data) => {
    console.log('Step1 valid', data);
    onSubmit(data);
  };

  const onInvalid = (errors: any) => {
    console.log('Step1 errors', errors);
  };

  return (
    <div className={cn("flex flex-col gap-6")}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Tạo tài khoản của bạn</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onValid, onInvalid)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="username">Tên đăng ký</FieldLabel>
                <Input id="username" placeholder="John Doe" {...register("username")} />
                {errors.username && <FieldDescription className="text-red-500">{errors.username.message}</FieldDescription>}
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" type="email" placeholder="m@example.com" {...register("email")} />
                {errors.email && <FieldDescription className="text-red-500">{errors.email.message}</FieldDescription>}
              </Field>
              <Field>
                <FieldLabel htmlFor="phoneNumber">Số điện thoại</FieldLabel>
                <Input id="phoneNumber" type="tel" placeholder="0123456789" {...register("phoneNumber")} />
                {errors.phoneNumber && <FieldDescription className="text-red-500">{errors.phoneNumber.message}</FieldDescription>}
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
                  <Input id="password" type="password" {...register("password")} />
                  {errors.password && <FieldDescription className="text-red-500">{errors.password.message}</FieldDescription>}
                </Field>
                <Field>
                  <FieldLabel htmlFor="confirmPassword">Xác nhận Mật khẩu</FieldLabel>
                  <Input id="confirmPassword" type="password" {...register("confirmPassword")} />
                  {errors.confirmPassword && <FieldDescription className="text-red-500">{errors.confirmPassword.message}</FieldDescription>}
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="role">Vai trò</FieldLabel>
                <Select
                  onValueChange={(value) => setValue("role", value as "player" | "org" | "referee")}
                  value={watch("role")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn vai trò" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="player">Cầu thủ</SelectItem>
                    <SelectItem value="org">Tổ chức</SelectItem>
                    <SelectItem value="referee">Trọng tài</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && <FieldDescription className="text-red-500">{errors.role.message}</FieldDescription>}
              </Field>
              <Button type="submit">Đăng ký</Button>
              <FieldDescription className="text-center">
                Bạn đã có tài khoản? <a href="/login">Đăng nhập</a>
              </FieldDescription>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
