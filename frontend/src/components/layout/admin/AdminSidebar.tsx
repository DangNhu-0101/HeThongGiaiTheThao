import { Link, useLocation, useNavigate } from "react-router-dom";
import { Activity, FileBarChart, Inbox, LayoutDashboard, LogOut, Newspaper, Settings, Users, X } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";

const NAV_ITEMS = [
  {
    group: "Tổng quan",
    items: [
      { name: "Bảng điều khiển", icon: LayoutDashboard, path: "/admin/dashboard" },
    ],
  },
  {
    group: "Quản lý nền tảng",
    items: [
      { name: "Người dùng", icon: Users, path: "/admin/users" },
      { name: "Cấu hình môn thi", icon: Activity, path: "/admin/sports" },
      { name: "Tin tức", icon: Newspaper, path: "/admin/news" },
      { name: "Tin nhắn liên hệ", icon: Inbox, path: "/admin/contact-messages" },
    ],
  },
  {
    group: "Hệ thống",
    items: [
      { name: "Báo cáo & Thống kê", icon: FileBarChart, path: "/admin/reports" },
      { name: "Cài đặt hệ thống", icon: Settings, path: "/admin/settings" },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  setOpen: (value: boolean) => void;
}

const AdminSidebar = ({ isOpen, setOpen }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-primary-dark/60 backdrop-blur-sm transition-opacity md:hidden" onClick={() => setOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-50 flex h-screen w-72 shrink-0 flex-col border-r border-border bg-card transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}>
        <div className="shrink-0 border-b border-white/10 bg-primary-dark p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary font-highlight text-sm font-semibold text-white shadow-sm">SA</div>
              <div>
                <h3 className="font-heading text-sm font-bold leading-tight text-white">System Admin</h3>
                <p className="text-[10px] font-medium text-white/70">Quản trị toàn hệ thống</p>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded p-1 transition-colors hover:bg-white/20 md:hidden" aria-label="Đóng menu">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="beautiful-scrollbar flex-1 space-y-6 overflow-y-auto p-4">
          {NAV_ITEMS.map((group) => (
            <div key={group.group}>
              <h4 className="mb-2 px-2 font-highlight text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{group.group}</h4>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                  return (
                    <li key={item.path}>
                      <Link to={item.path} onClick={() => setOpen(false)} className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-primary-light/25 hover:text-primary"}`}>
                        <item.icon className="mr-3 h-4 w-4" /> {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="shrink-0 border-t border-border p-4">
          <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10">
            <LogOut className="h-4 w-4" /> Đăng xuất
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
