import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, LayoutDashboard, LogOut, UserRound } from "lucide-react";
import { getManagementPath, getRoleLabel } from "@/libs/auth";
import { useAuthStore } from "@/stores/useAuthStore";

interface AccountMenuProps {
  compact?: boolean;
  dark?: boolean;
}

const AccountMenu = ({ compact = false, dark = false }: AccountMenuProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { accessToken, user, logout } = useAuthStore();
  const isLoggedIn = Boolean(accessToken && user);
  const roleLabel = getRoleLabel(user?.role);
  const textColor = dark ? "text-white" : "text-foreground";
  const mutedColor = dark ? "text-white/70" : "text-muted-foreground";

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    navigate("/");
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center gap-3">
        <Link
          to="/login"
          className={`inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            dark ? "text-white hover:text-accent hover:bg-white/10" : "text-foreground hover:bg-muted"
          }`}
        >
          Dang nhap
        </Link>
        <Link
          to="/register"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          Dang ky
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`flex items-center gap-3 rounded-lg p-1.5 transition-colors ${dark ? "hover:bg-white/10" : "hover:bg-muted"}`}
      >
        <div className={`text-right ${compact ? "hidden lg:block" : "hidden sm:block"}`}>
          <p className={`text-sm font-bold leading-tight ${textColor}`}>{user?.username || "Tai khoan"}</p>
          <p className={`text-[10px] font-bold uppercase ${mutedColor}`}>{roleLabel}</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/30">
          {(user?.username || "U").slice(0, 2).toUpperCase()}
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""} ${mutedColor}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-card text-foreground shadow-xl z-50">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-bold">{user?.username}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || user?.phoneNumber || roleLabel}</p>
          </div>

          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors"
          >
            <UserRound className="w-4 h-4 text-muted-foreground" />
            Thong tin ca nhan
          </Link>

          <Link
            to={getManagementPath(user?.role)}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors"
          >
            <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
            Quan ly {roleLabel}
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Dang xuat
          </button>
        </div>
      )}
    </div>
  );
};

export default AccountMenu;
