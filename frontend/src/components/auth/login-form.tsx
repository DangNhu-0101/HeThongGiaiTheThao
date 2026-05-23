import { cn } from "@/libs/utils"
import { Button } from "@/components/ui/button"
import { z } from "zod"
import { useAuthStore } from "@/stores/useAuthStore"
import { useNavigate } from "react-router-dom"

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
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"



const loginSchema = z.object({
  username: z.string().min(3, "Ít nhất 3 ký tự"),
  password: z.string().min(8, "Mật khẩu ít nhất 8 ký tự"),
});

type LoginFormData = z.infer<typeof loginSchema>;



export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const {
    register, handleSubmit, formState: { errors, isSubmitting }, } = useForm<LoginFormData>({
      resolver: zodResolver(loginSchema),
    });

  const onSubmit = async (data: LoginFormData) => {
    const { username, password } = data;
    await login(username, password);
    navigate('/');

  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Đăng nhập</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="username">
                  Tên đăng nhập
                </FieldLabel>
                <Input
                  id="username"
                  type="text"
                  placeholder="John Doe"
                  required
                  {...register("username")}
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password" >
                    Mật khẩu
                  </FieldLabel>
                  <a
                    href="/forgot-password"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Quên mật khẩu?
                  </a>
                </div>
                <Input id="password" type="password" required {...register("password")} />
              </Field>
              <Field>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
                </Button>
                <FieldDescription className="text-center">
                  Bạn chưa có tài khoản? <a href="/signup">Đăng ký</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
