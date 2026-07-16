import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, KeyRound, Mail, ShieldCheck } from "lucide-react";
import AuthLayout from "@/components/layout/authLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/libs/axios";
import { authService } from "@/services/authService";

type Step = "email" | "code" | "password" | "done";

const maskEmail = (email: string) => {
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  return `${name.slice(0, 2)}${"*".repeat(Math.max(2, name.length - 2))}@${domain}`;
};

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const passwordChecks = useMemo(() => ({
    length: newPassword.length >= 8,
    letter: /[A-Za-z]/.test(newPassword),
    number: /\d/.test(newPassword),
    match: newPassword.length > 0 && newPassword === confirmPassword,
  }), [newPassword, confirmPassword]);
  const passwordValid = Object.values(passwordChecks).every(Boolean);

  const run = async (handler: () => Promise<void>) => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await handler();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Thao tac thất bại, vui long thử lại."));
      console.error("Forgot password flow failed", requestError);
    } finally {
      setLoading(false);
    }
  };

  const requestCode = () => run(async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Email không hợp lệ");
      return;
    }
    const result = await authService.requestPasswordReset(email.trim());
    setMessage(result.message);
    setStep("code");
  });

  const verifyCode = () => run(async () => {
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Ma xac minh gom 6 chu so");
      return;
    }
    const result = await authService.verifyPasswordReset(email.trim(), code.trim());
    setResetToken(result.resetToken);
    setMessage(result.message);
    setStep("password");
  });

  const completeReset = () => run(async () => {
    if (!passwordValid) {
      setError("Mật khẩu moi chua dat yeu cau");
      return;
    }
    const result = await authService.resetPassword(resetToken, newPassword);
    setMessage(result.message);
    setStep("done");
  });

  return (
    <AuthLayout>
      <div className="mx-auto w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-8">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase text-primary">Khoi phuc tài khoản</p>
          <h1 className="mt-1 text-2xl font-bold">Quên mật khẩu</h1>
        </div>

        {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}
        {message && <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-700">{message}</div>}

        {step === "email" && (
          <div className="space-y-4">
            <label className="block text-xs font-bold uppercase text-muted-foreground">Email tài khoản</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="h-12 pl-10" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
            </div>
            <Button disabled={loading} onClick={requestCode} className="h-12 w-full font-bold">
              {loading ? "Đang gửi..." : "Gửi mã xác minh"}
            </Button>
          </div>
        )}

        {step === "code" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Mã xác minh đã được gửi đến {maskEmail(email)}.</p>
            <label className="block text-xs font-bold uppercase text-muted-foreground">Mã xác minh</label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="h-12 pl-10 tracking-[0.4em]" inputMode="numeric" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} />
            </div>
            <Button disabled={loading} onClick={verifyCode} className="h-12 w-full font-bold">
              {loading ? "Đang xác minh..." : "Xác minh"}
            </Button>
            <Button disabled={loading} variant="ghost" onClick={requestCode} className="w-full">Gui lai ma</Button>
          </div>
        )}

        {step === "password" && (
          <div className="space-y-4">
            <label className="block text-xs font-bold uppercase text-muted-foreground">Mật khẩu moi</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type={showPassword ? "text" : "password"} className="h-12 pl-10 pr-10" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Input type={showPassword ? "text" : "password"} className="h-12" placeholder="Xac nhan mật khẩu moi" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" />
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span className={passwordChecks.length ? "text-green-600" : "text-muted-foreground"}>It nhất 8 ky tu</span>
              <span className={passwordChecks.letter ? "text-green-600" : "text-muted-foreground"}>Co chu cai</span>
              <span className={passwordChecks.number ? "text-green-600" : "text-muted-foreground"}>Co chu so</span>
              <span className={passwordChecks.match ? "text-green-600" : "text-muted-foreground"}>Khop xac nhan</span>
            </div>
            <Button disabled={loading || !passwordValid} onClick={completeReset} className="h-12 w-full font-bold">
              {loading ? "Đang cập nhật..." : "Hoàn tất"}
            </Button>
          </div>
        )}

        {step === "done" && (
          <div className="space-y-4">
            <Button onClick={() => navigate("/login", { replace: true })} className="h-12 w-full font-bold">Quay lai đăng nhập</Button>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/login" className="font-bold text-primary hover:underline">Quay lai đăng nhập</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
