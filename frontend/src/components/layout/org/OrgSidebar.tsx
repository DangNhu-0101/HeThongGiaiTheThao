import { Link, useLocation, useNavigate } from "react-router-dom";
import { BarChart2, CalendarDays, ChevronDown, DollarSign, FileText, GitBranch, LayoutDashboard, ListChecks, LogOut, MapPin, Settings, Trophy, Users, X } from "lucide-react";
import { useOrgContextStore } from "@/stores/useOrgContextStore";
import { useAuthStore } from "@/stores/useAuthStore";

const NAV_ITEMS = [
  {
    group: "Tổng quan",
    items: [
      { name: "Bảng điều khiển", icon: LayoutDashboard, path: "/org/dashboard" },
      { name: "Danh sách giải", icon: ListChecks, path: "/org/tournaments" },
    ],
  },
  {
    group: "Quản lý",
    items: [
      { name: "Giải đấu", icon: Trophy, path: "/org/tournament" },
      { name: "Thể thức thi đấu", icon: GitBranch, path: "/org/competition-formats" },
      { name: "Trận & lịch thi đấu", icon: CalendarDays, path: "/org/schedule" },
      { name: "Kết quả thi đấu", icon: FileText, path: "/org/results" },
      { name: "Đội & VĐV", icon: Users, path: "/org/teams" },
      { name: "Tài nguyên", icon: MapPin, path: "/org/resources" },
    ],
  },
  {
    group: "Tài chính & báo cáo",
    items: [
      { name: "Tài trợ & lệ phí", icon: DollarSign, path: "/org/finance" },
      { name: "Báo cáo", icon: BarChart2, path: "/org/reports" },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  setOpen: (value: boolean) => void;
}

const OrgSidebar = ({ isOpen, setOpen }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { tournaments, selectedTournamentId, setSelectedTournamentId } = useOrgContextStore();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity md:hidden" onClick={() => setOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-50 flex h-screen w-72 shrink-0 flex-col border-r border-border bg-card transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}>
        <div className="shrink-0 border-b border-white/10 bg-header p-4 text-white">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary font-extrabold text-white shadow-sm">BT</div>
              <div>
                <h3 className="text-sm font-bold leading-tight">Ban tổ chức</h3>
                <p className="text-[10px] text-white/70">Cổng quản lý giải đấu</p>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded p-1 transition-colors hover:bg-white/20 md:hidden" aria-label="Đóng menu">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative">
            <select
              value={selectedTournamentId}
              onChange={(event) => setSelectedTournamentId(event.target.value)}
              disabled={tournaments.length === 0}
              className="w-full cursor-pointer appearance-none rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 pr-8 text-xs font-bold text-white transition-all hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Chọn giải đang quản lý"
            >
              {tournaments.length === 0 && <option value="" className="bg-white font-medium text-black">Chưa có giải</option>}
              {tournaments.map((tournament) => (
                <option key={tournament.id} value={tournament.id} className="bg-white font-medium text-black">{tournament.name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
          </div>
        </div>

        <div className="beautiful-scrollbar flex-1 space-y-6 overflow-y-auto p-4">
          {NAV_ITEMS.map((group) => (
            <div key={group.group}>
              <h4 className="mb-2 px-2 text-[10px] font-bold uppercase tracking-normal text-muted-foreground">{group.group}</h4>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                  return (
                    <li key={item.path}>
                      <Link to={item.path} onClick={() => setOpen(false)} className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"}`}>
                        <div className="flex items-center gap-3"><item.icon className="h-4 w-4" /> {item.name}</div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="shrink-0 space-y-1 border-t border-border p-4">
          <button type="button" className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground">
            <Settings className="h-4 w-4" /> Cài đặt
          </button>
          <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50">
            <LogOut className="h-4 w-4" /> Đăng xuất
          </button>
        </div>
      </aside>
    </>
  );
};

export default OrgSidebar;
