import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { Building2, CalendarDays, Camera, KeyRound, Loader2, Mail, Phone, ShieldCheck, Trash2, UserRound, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/libs/axios";
import { getRoleLabel } from "@/libs/auth";
import { authService } from "@/services/authService";
import { uploadService } from "@/services/uploadService";
import { useAuthStore } from "@/stores/useAuthStore";
import type { ProfileRole, RoleProfilePayload } from "@/types/auth";

type ProfileForm = {
  fullName: string;
  username: string;
  email: string;
  phoneNumber: string;
  birthDate: string;
  gender: "" | "male" | "female" | "other";
  address: string;
  bio: string;
  avatar: string;
};

const emptyForm: ProfileForm = {
  fullName: "",
  username: "",
  email: "",
  phoneNumber: "",
  birthDate: "",
  gender: "",
  address: "",
  bio: "",
  avatar: "",
};

type RoleForm = {
  role: ProfileRole;
  name: string;
  birthDate: string;
  gender: "male" | "female" | "other";
  skill: string;
  website: string;
  contactEmail: string;
  contactPhone: string;
  city: string;
  district: string;
  detail: string;
};

const emptyRoleForm: RoleForm = {
  role: "organization",
  name: "",
  birthDate: "",
  gender: "male",
  skill: "1",
  website: "",
  contactEmail: "",
  contactPhone: "",
  city: "",
  district: "",
  detail: "",
};

const ProfilePage = () => {
  const { user, loading, refreshCurrentUser, registerRoleProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"info" | "password" | "roles" | "security">("info");
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [roleForm, setRoleForm] = useState<RoleForm>(emptyRoleForm);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [roleSaving, setRoleSaving] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [expiresIn, setExpiresIn] = useState(0);
  const [resendAfter, setResendAfter] = useState(0);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    void refreshCurrentUser();
  }, [refreshCurrentUser]);

  useEffect(() => {
    if (!user) return;
    queueMicrotask(() => {
      setForm({
        fullName: user.fullName || "",
        username: user.username || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        birthDate: user.birthDate ? user.birthDate.slice(0, 10) : "",
        gender: user.gender || "",
        address: user.address || "",
        bio: user.bio || "",
        avatar: user.avatar || "",
      });
      setAvatarFile(null);
      setAvatarPreview("");
    });
  }, [user]);

  useEffect(() => {
    if (!avatarFile) return;
    const url = URL.createObjectURL(avatarFile);
    queueMicrotask(() => setAvatarPreview(url));
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  useEffect(() => {
    if (!otpSent) return;
    const interval = window.setInterval(() => {
      setExpiresIn((value) => Math.max(0, value - 1));
      setResendAfter((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [otpSent]);

  const displayName = form.fullName || form.username || "Tài khoản";
  const roleLabels = useMemo(() => user?.roles.map(getRoleLabel).join(", ") || "Người dùng", [user?.roles]);
  const joinedAt = user?.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "Chưa cập nhật";
  const hasRole = (role: ProfileRole) => {
    if (!user?.roles?.length) return false;
    if (role === "organization") return user.roles.some((item) => item === "org" || item === "organization" || item === "admin");
    return user.roles.includes(role);
  };

  const updateForm = <K extends keyof ProfileForm>(field: K, value: ProfileForm[K]) => setForm((current) => ({ ...current, [field]: value }));
  const updateRoleForm = <K extends keyof RoleForm>(field: K, value: RoleForm[K]) => setRoleForm((current) => ({ ...current, [field]: value }));

  const onAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const error = uploadService.validateImageFile(file, 3);
    if (error) {
      toast.error(error);
      return;
    }
    setAvatarFile(file);
  };

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.username.trim()) {
      toast.error("Tên tài khoản không được để trống.");
      return;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Email không đúng định dạng.");
      return;
    }

    setSaving(true);
    try {
      let avatar = form.avatar;
      if (avatarFile) avatar = await uploadService.image(avatarFile);
      await authService.updateProfile({ ...form, avatar });
      await refreshCurrentUser();
      setAvatarFile(null);
      setAvatarPreview("");
      toast.success("Đã cập nhật hồ sơ.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể cập nhật hồ sơ."));
    } finally {
      setSaving(false);
    }
  };

  const requestOtp = async () => {
    setPasswordLoading(true);
    try {
      const response = await authService.requestChangePasswordOtp();
      setOtpSent(true);
      setOtpVerified(false);
      setExpiresIn(response.expiresInSeconds || 600);
      setResendAfter(response.resendAfterSeconds || 60);
      toast.success(response.message || "Mã xác nhận đã được gửi đến email của bạn.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể gửi mã xác nhận."));
    } finally {
      setPasswordLoading(false);
    }
  };

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    if (!otpCode.trim()) {
      toast.error("Vui lòng nhập mã xác nhận.");
      return;
    }
    setPasswordLoading(true);
    try {
      await authService.verifyChangePasswordOtp(otpCode.trim());
      setOtpVerified(true);
      toast.success("Mã xác nhận hợp lệ. Bạn có thể đặt mật khẩu mới.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Mã xác nhận không hợp lệ."));
    } finally {
      setPasswordLoading(false);
    }
  };

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }
    setPasswordLoading(true);
    try {
      await authService.confirmChangePassword(otpCode.trim(), password);
      setOtpSent(false);
      setOtpVerified(false);
      setOtpCode("");
      setPassword("");
      setConfirmPassword("");
      toast.success("Đã cập nhật mật khẩu.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể cập nhật mật khẩu."));
    } finally {
      setPasswordLoading(false);
    }
  };

  const submitRoleProfile = async (event: FormEvent) => {
    event.preventDefault();
    const name = roleForm.name.trim() || form.fullName.trim() || form.username.trim();
    if (!name) {
      toast.error("Vui lòng nhập tên hiển thị cho hồ sơ vai trò.");
      return;
    }
    if (roleForm.role === "player" && !roleForm.birthDate) {
      toast.error("Vui lòng nhập ngày sinh của vận động viên.");
      return;
    }
    if (roleForm.role === "referee" && !roleForm.birthDate) {
      toast.error("Vui lòng nhập ngày sinh của trọng tài.");
      return;
    }

    let payload: RoleProfilePayload;
    if (roleForm.role === "organization") {
      payload = {
        name,
        website: roleForm.website.trim(),
        contactEmail: roleForm.contactEmail.trim() || form.email,
        contactPhone: roleForm.contactPhone.trim() || form.phoneNumber,
        address: {
          city: roleForm.city.trim(),
          district: roleForm.district.trim(),
          detail: roleForm.detail.trim(),
        },
      };
    } else if (roleForm.role === "player") {
      payload = {
        name,
        birthDate: roleForm.birthDate,
        gender: roleForm.gender,
        skill: Math.max(1, Number(roleForm.skill || 1)),
      };
    } else {
      payload = {
        name,
        birthDate: roleForm.birthDate,
        gender: roleForm.gender,
        phoneNumber: roleForm.contactPhone.trim() || form.phoneNumber,
      };
    }

    setRoleSaving(true);
    try {
      await registerRoleProfile(roleForm.role, payload);
      toast.success("Đã gửi hồ sơ đăng ký vai trò.");
    } finally {
      setRoleSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="page-shell flex-1 space-y-8 py-10">
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
          <div className="deep-band p-6 text-white sm:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="relative flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white/12 font-highlight text-4xl font-semibold text-accent">
                  {avatarPreview || form.avatar ? (
                    <img src={avatarPreview || form.avatar} alt={`Ảnh đại diện của ${displayName}`} className="h-full w-full object-cover" />
                  ) : (
                    displayName.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="font-highlight text-sm font-semibold uppercase text-accent">Hồ sơ người dùng</p>
                  <h1 className="mt-2 font-heading text-3xl font-bold text-white sm:text-4xl">{displayName}</h1>
                  <p className="mt-2 text-sm text-white/78">{form.email || "Chưa cập nhật email"}</p>
                  <p className="mt-1 text-sm text-white/70">{roleLabels}</p>
                </div>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/78">
                <span className="block font-semibold text-white">Ngày tham gia</span>
                {joinedAt}
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-3">
            <SummaryCard icon={Mail} label="Email" value={form.email || "Chưa cập nhật"} />
            <SummaryCard icon={Phone} label="Số điện thoại" value={form.phoneNumber || "Chưa cập nhật"} />
            <SummaryCard icon={ShieldCheck} label="Vai trò" value={roleLabels} />
          </div>
        </section>

        <div className="flex gap-2 overflow-x-auto rounded-2xl border border-border bg-card p-2 shadow-sm">
          {[
            ["info", "Thông tin cá nhân"],
            ["password", "Đổi mật khẩu"],
            ["roles", "Đăng ký vai trò"],
            ["security", "Bảo mật tài khoản"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20 ${
                activeTab === key ? "bg-primary text-white" : "text-muted-foreground hover:bg-primary-light/25 hover:text-primary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "info" && (
          <form onSubmit={saveProfile} className="grid gap-6 rounded-2xl border border-border bg-card p-5 shadow-sm lg:grid-cols-[0.45fr_1fr] lg:p-6">
            <section className="space-y-4">
              <h2 className="font-heading text-xl font-bold">Ảnh đại diện</h2>
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-muted/35 p-5 text-center">
                <div className="flex size-32 items-center justify-center overflow-hidden rounded-2xl bg-primary-dark font-highlight text-4xl font-semibold text-white">
                  {avatarPreview || form.avatar ? (
                    <img src={avatarPreview || form.avatar} alt="Xem trước ảnh đại diện" className="h-full w-full object-cover" />
                  ) : (
                    displayName.slice(0, 2).toUpperCase()
                  )}
                </div>
                <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark">
                  <Camera className="size-4" /> Chọn ảnh
                  <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="hidden" onChange={onAvatarChange} />
                </label>
                {(avatarPreview || form.avatar) && (
                  <Button type="button" variant="outline" className="mt-3" onClick={() => { setAvatarFile(null); setAvatarPreview(""); updateForm("avatar", ""); }}>
                    <Trash2 className="size-4" /> Xóa ảnh
                  </Button>
                )}
                <p className="mt-3 text-xs leading-5 text-muted-foreground">Hỗ trợ JPG, PNG, WEBP. Dung lượng tối đa 3 MB.</p>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <Field label="Họ và tên"><Input value={form.fullName} onChange={(event) => updateForm("fullName", event.target.value)} maxLength={120} /></Field>
              <Field label="Tên tài khoản"><Input required value={form.username} onChange={(event) => updateForm("username", event.target.value)} maxLength={80} /></Field>
              <Field label="Email"><Input type="email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} maxLength={160} /></Field>
              <Field label="Số điện thoại"><Input value={form.phoneNumber} onChange={(event) => updateForm("phoneNumber", event.target.value)} maxLength={24} /></Field>
              <Field label="Ngày sinh"><Input type="date" value={form.birthDate} onChange={(event) => updateForm("birthDate", event.target.value)} /></Field>
              <Field label="Giới tính">
                <select value={form.gender} onChange={(event) => updateForm("gender", event.target.value as ProfileForm["gender"])} className="h-10 w-full rounded-md border border-input bg-background px-3">
                  <option value="">Chưa cập nhật</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </Field>
              <Field label="Địa chỉ" className="sm:col-span-2"><Input value={form.address} onChange={(event) => updateForm("address", event.target.value)} maxLength={240} /></Field>
              <Field label="Mô tả cá nhân" className="sm:col-span-2">
                <textarea
                  value={form.bio}
                  onChange={(event) => updateForm("bio", event.target.value)}
                  rows={5}
                  maxLength={800}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-4 focus-visible:ring-ring/20"
                />
              </Field>
              <div className="flex justify-end sm:col-span-2">
                <Button type="submit" disabled={saving || loading}>
                  {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                  Lưu thay đổi
                </Button>
              </div>
            </section>
          </form>
        )}

        {activeTab === "password" && (
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><KeyRound className="size-5" /></div>
              <div>
                <h2 className="font-heading text-xl font-bold">Đổi mật khẩu bằng mã xác nhận email</h2>
                <p className="text-sm text-muted-foreground">Mã OTP chỉ gửi đến email của tài khoản đang đăng nhập và không hiển thị trên giao diện.</p>
              </div>
            </div>

            {!otpSent ? (
              <Button type="button" onClick={requestOtp} disabled={passwordLoading || !form.email}>
                {passwordLoading ? <Loader2 className="size-4 animate-spin" /> : null}
                Gửi mã xác nhận
              </Button>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                <form onSubmit={verifyOtp} className="space-y-4 rounded-2xl border border-border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">
                    Mã còn hiệu lực khoảng <strong>{Math.floor(expiresIn / 60)}:{String(expiresIn % 60).padStart(2, "0")}</strong>.
                  </p>
                  <Field label="Mã OTP">
                    <Input value={otpCode} onChange={(event) => setOtpCode(event.target.value)} inputMode="numeric" maxLength={6} />
                  </Field>
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" disabled={passwordLoading || otpVerified}>{otpVerified ? "Đã xác nhận" : "Xác nhận mã"}</Button>
                    <Button type="button" variant="outline" onClick={requestOtp} disabled={passwordLoading || resendAfter > 0}>
                      {resendAfter > 0 ? `Gửi lại sau ${resendAfter}s` : "Gửi lại mã"}
                    </Button>
                  </div>
                </form>

                <form onSubmit={changePassword} className="space-y-4 rounded-2xl border border-border bg-muted/30 p-4">
                  <Field label="Mật khẩu mới">
                    <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={!otpVerified} minLength={8} />
                  </Field>
                  <Field label="Xác nhận mật khẩu mới">
                    <Input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} disabled={!otpVerified} minLength={8} />
                  </Field>
                  <Button type="submit" disabled={passwordLoading || !otpVerified}>
                    {passwordLoading ? <Loader2 className="size-4 animate-spin" /> : null}
                    Cập nhật mật khẩu
                  </Button>
                </form>
              </div>
            )}
          </section>
        )}

        {activeTab === "roles" && (
          <form onSubmit={submitRoleProfile} className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:p-6">
            <div className="mb-6 flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Building2 className="size-5" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-bold">Đăng ký vai trò</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Gửi hồ sơ để bổ sung vai trò Ban tổ chức, vận động viên hoặc trọng tài. Vai trò quản trị chỉ do admin cấp.
                </p>
              </div>
            </div>

            <div className="mb-6 grid gap-3 md:grid-cols-3">
              {([
                ["organization", "Ban tổ chức", "Quản lý giải đấu, đội, lịch thi đấu và báo cáo."],
                ["player", "Vận động viên", "Tham gia đội, gửi yêu cầu gia nhập và theo dõi lệ phí."],
                ["referee", "Trọng tài", "Hỗ trợ điều hành trận đấu và ghi nhận kết quả."],
              ] as const).map(([role, title, description]) => {
                const selected = roleForm.role === role;
                const alreadyHadRole = hasRole(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => updateRoleForm("role", role)}
                    className={`rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20 ${
                      selected ? "border-primary bg-primary/10 text-title" : "border-border bg-background hover:border-primary-light hover:bg-primary-light/15"
                    }`}
                  >
                    <span className="block font-heading text-base font-bold">{title}</span>
                    <span className="mt-1 block text-sm leading-6 text-muted-foreground">{description}</span>
                    <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${alreadyHadRole ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                      {alreadyHadRole ? "Đã có vai trò" : "Có thể đăng ký"}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={roleForm.role === "organization" ? "Tên tổ chức" : "Họ và tên"}>
                <Input value={roleForm.name} onChange={(event) => updateRoleForm("name", event.target.value)} placeholder={form.fullName || form.username} maxLength={140} />
              </Field>

              {roleForm.role === "organization" ? (
                <>
                  <Field label="Website"><Input value={roleForm.website} onChange={(event) => updateRoleForm("website", event.target.value)} maxLength={180} /></Field>
                  <Field label="Email liên hệ"><Input type="email" value={roleForm.contactEmail} onChange={(event) => updateRoleForm("contactEmail", event.target.value)} placeholder={form.email} maxLength={160} /></Field>
                  <Field label="Số điện thoại liên hệ"><Input value={roleForm.contactPhone} onChange={(event) => updateRoleForm("contactPhone", event.target.value)} placeholder={form.phoneNumber} maxLength={24} /></Field>
                  <Field label="Tỉnh/thành phố"><Input value={roleForm.city} onChange={(event) => updateRoleForm("city", event.target.value)} maxLength={80} /></Field>
                  <Field label="Quận/huyện"><Input value={roleForm.district} onChange={(event) => updateRoleForm("district", event.target.value)} maxLength={80} /></Field>
                  <Field label="Địa chỉ chi tiết" className="sm:col-span-2"><Input value={roleForm.detail} onChange={(event) => updateRoleForm("detail", event.target.value)} maxLength={220} /></Field>
                </>
              ) : (
                <>
                  <Field label="Ngày sinh"><Input type="date" value={roleForm.birthDate} onChange={(event) => updateRoleForm("birthDate", event.target.value)} /></Field>
                  <Field label="Giới tính">
                    <select value={roleForm.gender} onChange={(event) => updateRoleForm("gender", event.target.value as RoleForm["gender"])} className="h-10 w-full rounded-md border border-input bg-background px-3">
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                  </Field>
                  {roleForm.role === "player" ? (
                    <Field label="Trình độ kỹ năng"><Input type="number" min={1} max={10} value={roleForm.skill} onChange={(event) => updateRoleForm("skill", event.target.value)} /></Field>
                  ) : (
                    <Field label="Số điện thoại"><Input value={roleForm.contactPhone} onChange={(event) => updateRoleForm("contactPhone", event.target.value)} placeholder={form.phoneNumber} maxLength={24} /></Field>
                  )}
                </>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <Button type="submit" disabled={roleSaving || loading || hasRole(roleForm.role)}>
                {roleSaving ? <Loader2 className="size-4 animate-spin" /> : null}
                {hasRole(roleForm.role) ? "Đã có vai trò này" : "Gửi đăng ký vai trò"}
              </Button>
            </div>
          </form>
        )}

        {activeTab === "security" && (
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:p-6">
            <h2 className="font-heading text-xl font-bold">Bảo mật tài khoản</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <SummaryCard icon={UserRound} label="Trạng thái" value="Thông tin cá nhân do bạn quản lý" />
              <SummaryCard icon={ShieldCheck} label="Vai trò" value="Không thể tự thay đổi vai trò" />
              <SummaryCard icon={CalendarDays} label="Ngày tham gia" value={joinedAt} />
            </div>
            <p className="mt-5 text-sm leading-7 text-muted-foreground">
              Các trường quản trị nội bộ như vai trò, trạng thái tài khoản và định danh kỹ thuật không được hiển thị hoặc cho phép chỉnh sửa tại trang hồ sơ.
            </p>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

const Field = ({ label, className = "", children }: { label: string; className?: string; children: ReactNode }) => (
  <label className={`space-y-1.5 text-sm font-semibold ${className}`}>
    <span>{label}</span>
    {children}
  </label>
);

const SummaryCard = ({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) => (
  <div className="rounded-2xl border border-border bg-muted/30 p-4">
    <Icon className="mb-3 size-5 text-primary" />
    <p className="text-xs font-bold uppercase text-muted-foreground">{label}</p>
    <p className="mt-1 break-words font-semibold text-title">{value}</p>
  </div>
);

export default ProfilePage;
