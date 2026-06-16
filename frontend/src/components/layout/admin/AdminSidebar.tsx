import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Building2, Users, Activity, FileBarChart, Settings, LogOut, X } from "lucide-react";

const NAV_ITEMS = [
  { group: "TỔNG QUAN", items: [
    { name: "Bảng điều khiển", icon: LayoutDashboard, path: "/admin/dashboard" },
  ]},
  { group: "QUẢN LÝ NỀN TẢNG", items: [
    { name: "Tổ chức (Orgs)", icon: Building2, path: "/admin/organizations", badge: 24 },
    { name: "Người dùng", icon: Users, path: "/admin/users", badge: 5 },
    { name: "Cấu hình Môn thi", icon: Activity, path: "/admin/sports" },
  ]},
  { group: "HỆ THỐNG", items: [
    { name: "Báo cáo & Thống kê", icon: FileBarChart, path: "/admin/reports" },
    { name: "Cài đặt hệ thống", icon: Settings, path: "/admin/settings" },
  ]}
];

interface SidebarProps {
  isOpen: boolean;
  setOpen: (v: boolean) => void;
}

const AdminSidebar = ({ isOpen, setOpen }: SidebarProps) => {
  const location = useLocation();

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity" onClick={() => setOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border h-screen flex flex-col shrink-0 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}>
        
        {/* Brand Header */}
        <div className="p-4 border-b border-border bg-amber-500 text-white shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black/20 text-white font-black rounded-md flex items-center justify-center shadow-sm">SA</div>
              <div>
                <h3 className="font-bold text-sm leading-tight">System Admin</h3>
                <p className="text-[10px] text-white/80 font-medium">Quản trị Toàn cầu</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="md:hidden p-1 hover:bg-black/20 rounded transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Links */}
        <div className="flex-1 overflow-y-auto beautiful-scrollbar p-4 space-y-6">
          {NAV_ITEMS.map((group, idx) => (
            <div key={idx}>
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2">{group.group}</h4>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = location.pathname.includes(item.path);
                  return (
                    <li key={item.path}>
                      <Link to={item.path} onClick={() => setOpen(false)} className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-amber-500/10 text-amber-600 font-bold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                        <div className="flex items-center gap-3"><item.icon className="w-4 h-4" /> {item.name}</div>
                        {item.badge && <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{item.badge}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border shrink-0">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut className="w-4 h-4" /> Đăng xuất
          </button>
        </div>
      </aside>
    </>
  );
};
export default AdminSidebar;