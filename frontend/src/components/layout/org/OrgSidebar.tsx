import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, BarChart2, Bell, Trophy, CalendarDays, Users, MapPin, DollarSign, FileText, Settings, LogOut, X, ChevronDown } from "lucide-react";
import { useOrgContextStore } from "@/stores/useOrgContextStore";

const NAV_ITEMS = [
  { group: "TỔNG QUAN", items: [
    { name: "Bảng điều khiển", icon: LayoutDashboard, path: "/org/dashboard" },
    { name: "Phân tích", icon: BarChart2, path: "/org/analytics" },
    { name: "Thông báo", icon: Bell, path: "/org/notifications", badge: 5 },
  ]},
  { group: "QUẢN LÝ", items: [
    { name: "Giải đấu", icon: Trophy, path: "/org/tournaments", badge: 8 },
    { name: "Trận & Lịch thi đấu", icon: CalendarDays, path: "/org/schedule" },
    { name: "Kết quả thi đấu", icon: FileText, path: "/org/results" },
    { name: "Đội & VĐV", icon: Users, path: "/org/teams" },
    { name: "Tài nguyên", icon: MapPin, path: "/org/resources" },
  ]},
  { group: "TÀI CHÍNH & BÁO CÁO", items: [
    { name: "Tài trợ & Lệ phí", icon: DollarSign, path: "/org/finance" },
    { name: "Báo cáo", icon: BarChart2, path: "/org/reports" },
  ]}
];

interface SidebarProps {
  isOpen: boolean;
  setOpen: (v: boolean) => void;
}

const OrgSidebar = ({ isOpen, setOpen }: SidebarProps) => {
  const location = useLocation();
  
  // Lấy dữ liệu từ Context Store
  const { tournaments, selectedTournamentId, setSelectedTournamentId } = useOrgContextStore();

  return (
    <>
      {/* Màng đen che màn hình (Mobile) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity" 
          onClick={() => setOpen(false)} 
        />
      )}

      {/* Vỏ Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border h-screen flex flex-col shrink-0
          transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0
          ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
        `}
      >
        
        {/* HEADER: Tiêu đề & Chọn Giải Đấu */}
        <div className="p-4 border-b border-border bg-header text-white shrink-0">
          
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-accent text-accent-foreground font-black rounded-md flex items-center justify-center shadow-sm">VT</div>
              <div>
                <h3 className="font-bold text-sm leading-tight">Vũng Tàu Org</h3>
                <p className="text-[10px] text-white/70">Cổng Ban Tổ Chức</p>
              </div>
            </div>
            {/* Nút X đóng menu (Chỉ hiện trên Mobile: md:hidden) */}
            <button onClick={() => setOpen(false)} className="md:hidden p-1 hover:bg-white/20 rounded transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Ô Select đổi giải đấu */}
          <div className="relative">
            <select
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
              className="w-full appearance-none bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold rounded-lg px-3 py-2.5 pr-8 focus:outline-none focus:ring-1 focus:ring-accent transition-colors cursor-pointer"
            >
              {tournaments.map(t => (
                <option key={t.id} value={t.id} className="text-black bg-white font-medium">
                  {t.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none" />
          </div>

        </div>

        {/* Danh sách Links */}
        <div className="flex-1 overflow-y-auto beautiful-scrollbar p-4 space-y-6">
          {NAV_ITEMS.map((group, idx) => (
            <div key={idx}>
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2">{group.group}</h4>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = location.pathname.includes(item.path);
                  return (
                    <li key={item.path}>
                      <Link 
                        to={item.path} 
                        onClick={() => setOpen(false)} 
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="w-4 h-4" />
                          {item.name}
                        </div>
                        {item.badge && (
                          <span className="bg-accent text-accent-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Nút Đăng xuất */}
        <div className="p-4 border-t border-border space-y-1 shrink-0">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors">
            <Settings className="w-4 h-4" /> Cài đặt
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut className="w-4 h-4" /> Đăng xuất
          </button>
        </div>

      </aside>
    </>
  );
};
export default OrgSidebar;