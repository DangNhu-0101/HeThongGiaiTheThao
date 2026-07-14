import { useEffect, useState } from "react";
import { ChevronDown, List, Menu, Search, ShieldPlus, Trophy, Users, X } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import AccountMenu from "./AccountMenu";
import NotificationCenter from "./NotificationCenter";
import { Button } from "@/components/ui/button";
import { canAccessRoles, ORGANIZER_ROLES } from "@/libs/auth";
import { useAuthStore } from "@/stores/useAuthStore";
import { useTeamCollaborationStore } from "@/stores/useTeamCollaborationStore";
import type { UserRole } from "@/types/user";

const publicNavItems = [
  { label: "Trang chủ", to: "/" },
  { label: "Tin tức", to: "/news" },
  { label: "Về chúng tôi", to: "/about" },
  { label: "Liên hệ", to: "/contact" },
];

type TournamentAction =
  | {
      label: string;
      description: string;
      icon: typeof List;
      to: string;
    }
  | {
      label: string;
      description: string;
      icon: typeof List;
      protectedPath: string;
      roles: UserRole[];
    };

const tournamentActions: TournamentAction[] = [
  {
    label: "Danh sách giải",
    description: "Xem các giải đang mở đăng ký, sắp diễn ra và đang thi đấu.",
    icon: List,
    to: "/tournaments",
  },
  {
    label: "Tạo giải",
    description: "Không gian quản lý giải dành cho Ban tổ chức.",
    icon: ShieldPlus,
    protectedPath: "/org/tournaments",
    roles: ORGANIZER_ROLES,
  },
  {
    label: "Tạo đội",
    description: "Lập hồ sơ đội để tham gia các giải phù hợp.",
    icon: Users,
    protectedPath: "/teams/create",
    roles: ["player"],
  },
  {
    label: "Tìm đội",
    description: "Kết nối với đội đang cần thành viên.",
    icon: Search,
    protectedPath: "/teams/find",
    roles: ["player"],
  },
];

const Header = () => {
  const navigate = useNavigate();
  const [tournamentOpen, setTournamentOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileTournamentOpen, setMobileTournamentOpen] = useState(true);
  const { accessToken, user, initialized } = useAuthStore();
  const fetchNotifications = useTeamCollaborationStore((state) => state.fetchNotifications);

  useEffect(() => {
    if (!accessToken) return;
    void fetchNotifications();
  }, [accessToken, fetchNotifications]);

  const closeMenus = () => {
    setTournamentOpen(false);
    setMobileOpen(false);
  };

  const openProtectedPage = (path: string, allowedRoles: UserRole[]) => {
    closeMenus();
    if (!initialized) {
      toast.info("Đang kiểm tra phiên đăng nhập, vui lòng thử lại sau giây lát.");
      return;
    }
    if (!accessToken || !user) {
      navigate("/login", { state: { from: path, requiredRoles: allowedRoles } });
      return;
    }
    if (!canAccessRoles(user.roles, allowedRoles)) {
      toast.error("Tài khoản của bạn chưa có quyền để truy cập chức năng này.");
      navigate("/profile");
      return;
    }
    navigate(path);
  };

  const renderTournamentMenu = (mobile = false) => (
    <div
      className={
        mobile
          ? "grid gap-2"
          : "absolute left-0 z-50 mt-4 w-[26rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border bg-card p-2 text-foreground shadow-[var(--shadow-panel)]"
      }
    >
      {tournamentActions.map((item) => {
        const Icon = item.icon;
        const className =
          "flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200 hover:bg-secondary hover:text-secondary-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20";
        const content = (
          <>
            <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
              <Icon className="size-4" />
            </span>
            <span>
              <strong className="block text-sm font-bold">{item.label}</strong>
              <span className="text-xs leading-relaxed text-muted-foreground">{item.description}</span>
            </span>
          </>
        );

        if ("to" in item) {
          return (
            <Link key={item.label} to={item.to} onClick={closeMenus} className={className}>
              {content}
            </Link>
          );
        }

        return (
          <button
            key={item.label}
            type="button"
            onClick={() => openProtectedPage(item.protectedPath, item.roles)}
            className={className}
          >
            {content}
          </button>
        );
      })}
    </div>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-header text-header-foreground shadow-sm">
      <div className="page-shell flex h-[4.75rem] items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-8">
          <Link to="/" className="flex shrink-0 items-center gap-3 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20" onClick={closeMenus}>
            <div className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15">
              <Trophy className="size-5" />
            </div>
            <span className="leading-tight">
              <span className="block text-base font-extrabold tracking-normal text-white">TMS</span>
              <span className="block text-[10px] font-semibold uppercase text-white/60">
                Tournament Suite
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 text-sm font-semibold lg:flex" aria-label="Điều hướng chính">
            {publicNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative rounded-lg px-3 py-2 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20 ${
                    isActive ? "text-white after:absolute after:inset-x-3 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-primary" : "text-white/76"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="relative">
              <button
                type="button"
                onClick={() => setTournamentOpen((value) => !value)}
                onBlur={(event) => {
                  if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node | null)) setTournamentOpen(false);
                }}
                aria-expanded={tournamentOpen}
                className={`relative flex items-center gap-1 rounded-lg px-3 py-2 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20 ${
                  tournamentOpen ? "text-white after:absolute after:inset-x-3 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-primary" : "text-white/76"
                }`}
              >
                Giải đấu
                <ChevronDown className={`size-4 transition-transform ${tournamentOpen ? "rotate-180" : ""}`} />
              </button>
              {tournamentOpen && renderTournamentMenu()}
            </div>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {accessToken && <NotificationCenter />}
          <div className="hidden sm:block">
            <AccountMenu dark />
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-white hover:bg-white/10 hover:text-white lg:hidden"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      <div className={`overflow-hidden border-t border-white/10 bg-header text-white transition-all duration-300 lg:hidden ${mobileOpen ? "max-h-[calc(100dvh-4.75rem)] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="page-shell max-h-[calc(100dvh-4.75rem)] space-y-4 overflow-y-auto py-4">
          <div className="grid gap-2 text-sm font-semibold">
            {publicNavItems.map((item) => (
              <NavLink key={item.to} to={item.to} onClick={closeMenus} className="rounded-xl px-3 py-2 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20">
                {item.label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={() => setMobileTournamentOpen((value) => !value)}
              className="flex items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20"
              aria-expanded={mobileTournamentOpen}
            >
              Giải đấu
              <ChevronDown className={`size-4 transition-transform ${mobileTournamentOpen ? "rotate-180" : ""}`} />
            </button>
            {mobileTournamentOpen && <div className="rounded-2xl border border-white/10 bg-white/5 p-2">{renderTournamentMenu(true)}</div>}
          </div>
          <div className="sm:hidden">
            <AccountMenu dark />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
