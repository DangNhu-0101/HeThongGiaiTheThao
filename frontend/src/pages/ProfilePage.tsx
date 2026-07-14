import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Activity, Award, CalendarDays, CheckCircle2, Clock, Mail, Phone, ShieldAlert, Trophy, UserRound, UsersRound, type LucideIcon } from "lucide-react";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getRoleLabel } from "@/libs/auth";
import { useAuthStore } from "@/stores/useAuthStore";
import { profileService, type ProfileTeamRecord } from "@/services/profileService";
import type { ProfileRole, RoleProfilePayload } from "@/types/auth";
import type { LinkedProfile, User } from "@/types/user";

interface PlayerProfile extends LinkedProfile { skill?: number; }
interface OrganizationProfile extends LinkedProfile { address?: { detail?: string } | string; }
interface RefereeProfile extends LinkedProfile { sports?: Array<{ category?: string }>; specialization?: string; }

const roleOptions: Array<{ value: ProfileRole; label: string }> = [
  { value: "player", label: "Vận động viên" },
  { value: "organization", label: "Ban tổ chức" },
  { value: "referee", label: "Trọng tài" },
];

const isProfileForRole = (profile: LinkedProfile | null | undefined, role: ProfileRole) => {
  if (!profile) return false;
  if (role === "organization") return profile.type === "organization" || profile.type === "org";
  return profile.type === role;
};

const getRoleProfile = (user: User | null, role: ProfileRole): LinkedProfile | null => {
  if (!user) return null;
  const directProfile =
    role === "player"
      ? user.playerProfile || user.player
      : role === "organization"
        ? user.organizationProfile || user.organization
        : user.refereeProfile || user.referee;
  if (directProfile) return directProfile;
  if (isProfileForRole(user.profile, role)) return user.profile || null;
  return user.profiles?.find((profile) => isProfileForRole(profile, role)) || null;
};

const statusText = (status?: string) => {
  if (["actived", "active", "approved"].includes(status || "")) return "Đang hoạt động";
  if (status === "rejected") return "Bị từ chối";
  return "Chờ duyệt";
};

const ProfilePage = () => {
  const { user, loading, error, refreshCurrentUser, registerRoleProfile } = useAuthStore();
  const [teams, setTeams] = useState<ProfileTeamRecord[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [role, setRole] = useState<ProfileRole>("player");
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");
  const [detail, setDetail] = useState("");

  const targetProfile = useMemo(() => getRoleProfile(user, role), [role, user]);
  const activeProfile = useMemo(() => getRoleProfile(user, "player") || user?.profile || null, [user]);
  const hasProfileInDb = Boolean(targetProfile);
  const isProfileActived = role === "player" ? Boolean(targetProfile) : ["actived", "active", "approved"].includes(targetProfile?.status || "");

  useEffect(() => {
    void refreshCurrentUser();
    setTeamsLoading(true);
    profileService.getMyTeams()
      .then(setTeams)
      .catch(() => setTeams([]))
      .finally(() => setTeamsLoading(false));
  }, [refreshCurrentUser]);

  useEffect(() => {
    if (targetProfile) {
      setName(targetProfile.name || "");
      setBirthDate(targetProfile.birthDate ? targetProfile.birthDate.slice(0, 10) : "");
      setGender(targetProfile.gender || "male");
      if (role === "organization") {
        const org = targetProfile as OrganizationProfile;
        setDetail(typeof org.address === "object" ? org.address?.detail || "" : org.address || "");
      } else if (role === "player") {
        setDetail(String((targetProfile as PlayerProfile).skill || 1));
      } else {
        const referee = targetProfile as RefereeProfile;
        setDetail(referee.sports?.[0]?.category || referee.specialization || "");
      }
    } else {
      setName("");
      setBirthDate("");
      setGender("male");
      setDetail("");
    }
  }, [role, targetProfile]);

  const submitRoleProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (hasProfileInDb) return;
    let payload: RoleProfilePayload;
    if (role === "organization") {
      payload = { name, contactEmail: user?.email, contactPhone: user?.phoneNumber, address: { detail } };
    } else if (role === "player") {
      payload = { name, birthDate, gender, skill: Number(detail) || 1, sports: [] };
    } else {
      payload = { name, birthDate, gender, phoneNumber: user?.phoneNumber, sports: detail ? [{ category: detail, yearsOfExperience: 0 }] : [] };
    }
    await registerRoleProfile(role, payload);
    void refreshCurrentUser();
  };

  const statCards = [
    { label: "Đội đang tham gia", value: teams.length, icon: UsersRound, className: "bg-secondary text-secondary-foreground" },
    { label: "Giải đã đăng ký", value: new Set(teams.map((team) => team.tournamentName)).size, icon: Trophy, className: "bg-accent text-accent-foreground" },
    { label: "Hồ sơ vai trò", value: user?.profiles?.length || (activeProfile ? 1 : 0), icon: Award, className: "bg-primary text-primary-foreground" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="page-shell flex-1 space-y-8 py-10">
        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-soft)]">
          <div className="deep-band p-8 text-white">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="flex items-center gap-5">
                <div className="flex size-24 items-center justify-center rounded-lg border border-white/20 bg-white/12 text-4xl font-black text-accent">
                  {user?.avatar ? <img src={user.avatar} alt={user.username} className="h-full w-full rounded-lg object-cover" /> : (user?.username || "U").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold uppercase text-accent">Hồ sơ người dùng</p>
                  <h1 className="mt-1 text-4xl font-black">{activeProfile?.name || user?.username || "Tài khoản"}</h1>
                  <p className="mt-2 text-sm text-white/72">{user?.roles.map(getRoleLabel).join(" · ") || "Chưa xác định vai trò"}</p>
                </div>
              </div>
              <Button variant="outline" disabled={loading} onClick={() => void refreshCurrentUser()} className="border-white/25 bg-white/10 text-white hover:bg-white hover:text-header">
                Tải lại hồ sơ
              </Button>
            </div>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-3">
            {statCards.map((item) => (
              <div key={item.label} className={`rounded-lg p-5 ${item.className}`}>
                <item.icon className="mb-4 size-6" />
                <div className="text-3xl font-black">{item.value}</div>
                <p className="mt-1 text-sm font-bold opacity-[0.78]">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-black">Thông tin cá nhân</h2>
            <Info icon={UserRound} label="Tên tài khoản" value={user?.username || "Chưa cập nhật"} />
            <Info icon={Mail} label="Email" value={user?.email || "Chưa đồng bộ"} />
            <Info icon={Phone} label="Số điện thoại" value={user?.phoneNumber || "Chưa cập nhật"} />
            <Info icon={Activity} label="Trạng thái hồ sơ" value={statusText(activeProfile?.status)} />
          </section>

          <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">Đội và lịch sử tham gia</h2>
                <p className="text-sm text-muted-foreground">Dữ liệu lấy từ các participant/team đã đăng ký của tài khoản.</p>
              </div>
              <CalendarDays className="size-6 text-primary" />
            </div>
            {teamsLoading ? (
              <p className="text-sm text-muted-foreground">Đang tải đội...</p>
            ) : teams.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                Chưa có đội hoặc lịch sử đăng ký giải.
              </div>
            ) : (
              <div className="grid gap-3">
                {teams.map((team) => (
                  <div key={team.id} className="rounded-lg border border-border bg-secondary/55 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="font-black">{team.name}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">{team.tournamentName} · {team.sport}</p>
                      </div>
                      <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-bold text-secondary-foreground">{team.status}</span>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">{team.members} thành viên</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-black uppercase">Đăng ký hồ sơ vai trò</h2>
          <div className="mt-3 rounded-lg border border-border bg-muted/50 p-4 text-xs text-muted-foreground">
            <p className="flex items-center gap-1.5 text-sm font-bold text-foreground">
              <ShieldAlert className="size-4 text-primary" /> Cơ chế đồng bộ và kích hoạt hồ sơ
            </p>
            <p className="mt-2">Vận động viên được kích hoạt nhanh; ban tổ chức và trọng tài cần chờ quản trị viên duyệt.</p>
          </div>

          {hasProfileInDb && (
            <div className={`mt-4 flex items-center gap-2 rounded-lg border p-3 text-sm ${isProfileActived ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
              {isProfileActived ? <CheckCircle2 className="size-5 shrink-0 text-emerald-600" /> : <Clock className="size-5 shrink-0 text-amber-600" />}
              <span>Hồ sơ vai trò <strong>{getRoleLabel(role)}</strong> hiện ở trạng thái <strong>{statusText(targetProfile?.status)}</strong>.</span>
            </div>
          )}

          <form onSubmit={submitRoleProfile} className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm font-semibold">
              Chọn phân hệ hồ sơ
              <select value={role} onChange={(event) => setRole(event.target.value as ProfileRole)} className="h-10 w-full rounded-md border border-input bg-background px-3 font-bold text-primary">
                {roleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>

            <label className="space-y-1 text-sm font-semibold">
              Tên hồ sơ hiển thị *
              <Input required disabled={hasProfileInDb} value={name} onChange={(event) => setName(event.target.value)} />
            </label>

            {role !== "organization" && (
              <>
                <label className="space-y-1 text-sm font-semibold">Ngày sinh *<Input required disabled={hasProfileInDb} type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} /></label>
                <label className="space-y-1 text-sm font-semibold">Giới tính *
                  <select disabled={hasProfileInDb} value={gender} onChange={(event) => setGender(event.target.value as typeof gender)} className="h-10 w-full rounded-md border border-input bg-background px-3">
                    <option value="male">Nam</option><option value="female">Nữ</option><option value="other">Khác</option>
                  </select>
                </label>
              </>
            )}

            <label className="space-y-1 text-sm font-semibold md:col-span-2">
              {role === "organization" ? "Địa chỉ hoạt động *" : role === "player" ? "Trình độ cá nhân (Điểm từ 1 - 5) *" : "Môn thể thao chuyên môn phụ trách"}
              <Input required={role !== "referee"} disabled={hasProfileInDb} type={role === "player" ? "number" : "text"} min={role === "player" ? 1 : undefined} max={role === "player" ? 5 : undefined} value={detail} onChange={(event) => setDetail(event.target.value)} />
            </label>

            {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}
            <Button disabled={loading || hasProfileInDb} type="submit" className="h-11 text-sm font-bold md:col-span-2">
              {loading ? "Đang xử lý..." : hasProfileInDb ? "Hồ sơ phân hệ này đã được khởi tạo" : `Gửi hồ sơ đăng ký ${getRoleLabel(role)}`}
            </Button>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
};

const Info = ({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) => (
  <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/35 p-4">
    <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
    <div>
      <p className="text-xs font-bold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 break-all font-semibold">{value}</p>
    </div>
  </div>
);

export default ProfilePage;
