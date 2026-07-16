import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, LayoutDashboard, LogOut, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { canAccessRoles, canManageTournaments } from "@/libs/auth";
import { useAuthStore } from "@/stores/useAuthStore";

interface AccountMenuProps {
  compact?: boolean;
  dark?: boolean;
}

const readDisplayName = (user: ReturnType<typeof useAuthStore.getState>["user"]) => {
  const organizationName = user?.organizationProfile?.name || user?.organization?.name;
  return organizationName || user?.fullName || user?.profile?.name || user?.playerProfile?.name || user?.player?.name || user?.username || "Tài khoản";
};

const AccountMenu = ({ compact = false, dark = false }: AccountMenuProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { accessToken, user, logout } = useAuthStore();
  const isLoggedIn = Boolean(accessToken && user);
  const displayName = readDisplayName(user);
  const contact = user?.email || user?.organizationProfile?.contactEmail || user?.phoneNumber || "Chưa cập nhật email";
  const isAdmin = canAccessRoles(user?.roles || [], ["admin"]);
  const canOpenOrg = canManageTournaments(user?.roles);
  const canOpenTeams = canAccessRoles(user?.roles || [], ["player", "org", "organization"]);
  const avatarText = displayName.trim().slice(0, 2).toUpperCase() || "TM";

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    navigate("/");
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center gap-2">
        <Link to="/login" className={`inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/25 ${dark ? "text-white hover:bg-white/10" : "text-foreground hover:bg-muted"}`}>
          Đăng nhập
        </Link>
        <Link to="/register" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25">
          Đăng ký
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`flex items-center gap-3 rounded-xl p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/25 ${dark ? "hover:bg-white/10" : "hover:bg-muted"}`}
      >
        <div className={`text-right ${compact ? "hidden lg:block" : "hidden sm:block"}`}>
          <p className={`max-w-32 truncate text-xs font-semibold ${dark ? "text-white" : "text-foreground"}`}>{displayName}</p>
          <p className={`max-w-32 truncate text-[11px] ${dark ? "text-white/70" : "text-muted-foreground"}`}>{contact}</p>
        </div>
        <div className="flex size-9 items-center justify-center rounded-full border border-white/25 bg-primary-dark text-xs font-bold text-white">
          {avatarText}
        </div>
        <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""} ${dark ? "text-white/80" : "text-muted-foreground"}`} />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-[var(--shadow-panel)]">
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-bold">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{contact}</p>
          </div>
          {!isAdmin && (
            <Link to="/profile" onClick={() => setOpen(false)} role="menuitem" className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:bg-muted">
              <UserRound className="size-4 text-muted-foreground" />
              Tài khoản của tôi
            </Link>
          )}

          {isAdmin && (
            <Link to="/admin/users" onClick={() => setOpen(false)} role="menuitem" className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:bg-muted">
              <ShieldCheck className="size-4 text-muted-foreground" />
              Quản lý quản trị viên
            </Link>
          )}

          {canOpenTeams && !isAdmin && (
            <Link to="/my-teams" onClick={() => setOpen(false)} role="menuitem" className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:bg-muted">
              <UsersRound className="size-4 text-muted-foreground" />
              Đội của tôi
            </Link>
          )}

          {canOpenOrg && !isAdmin && (
            <Link to="/org/tournaments" onClick={() => setOpen(false)} role="menuitem" className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:bg-muted">
              <LayoutDashboard className="size-4 text-muted-foreground" />
              Quản lý ban tổ chức
            </Link>
          )}

          <button type="button" onClick={handleLogout} role="menuitem" className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-accent transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:bg-red-50">
            <LogOut className="size-4" />
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
};

export default AccountMenu;
