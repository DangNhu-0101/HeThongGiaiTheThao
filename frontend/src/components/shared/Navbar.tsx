import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, ChevronDown, Menu, LogOut, User as UserIcon, Settings, Trophy, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import api from "@/api/axiosConfig";
import { useTournamentStore } from "@/stores/useTournamentStore";
import { useAuthStore } from "@/stores/useAuthStore";
import type {User} from "@/types/user";
import { USER_ROLE } from "@/constants";
import type { Notification } from "@/types/notification";





const NAV_LINKS = [
  { label: "Trang chủ", href: "/" },
  { label: "Các giải đấu", href: "/tournaments" },
  { label: "Đội thi đấu", href: "/teams" },
];

const USER_MENU: Record<string, { label: string; href: string; icon: React.ReactNode }[]> = {

  [USER_ROLE.ORGANIZER]: [
    { label: "Quản lý tổ chức", href: "/org", icon: <Settings className="mr-2 h-4 w-4" /> },
  ],

  [USER_ROLE.PLAYER]: [
    { label: "Đội của tôi", href: "/my-teams", icon: <UserIcon className="mr-2 h-4 w-4" /> },
  ]
};

export function Navbar() {
  const navigate = useNavigate();
  const { tournamentList } = useTournamentStore();

  const { user, logout } = useAuthStore() as unknown as { user: User | null; logout: () => void };
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Ép kiểu an toàn và nối Base URL để hiển thị hình ảnh
  const activeTournament = tournamentList?.[0] as { logo?: string } | undefined;
  const activeTournamentLogo = activeTournament?.logo 
    ? `http://localhost:5001/${activeTournament.logo.replace(/\\/g, '/')}` 
    : null;

  useEffect(() => {
    // Gọi API Notifications nếu đã đăng nhập
    let isMounted = true;
    if (user) {
      api.get("/notifications")
         .then(res => { if (isMounted) setNotifications(res.data.data || []); })
         .catch(err => console.error("Failed to load notifications", err));
    }
    return () => { isMounted = false; };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllRead = async () => {
    try {
      await api.put("/notifications/mark-read");
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Mark read failed", error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Logo & Brand */}
        <Link to="/" className="flex items-center gap-3">
          {activeTournamentLogo ? (
            <img src={activeTournamentLogo} alt="Tournament Logo" className="h-8 w-8 object-contain" />
          ) : (
            <div className="h-8 w-8 bg-sky-600 rounded-lg flex items-center justify-center">
              <Trophy className="h-5 w-5 text-white" />
            </div>
          )}
          <span className="font-bold text-xl text-slate-900 tracking-tight hidden sm:block">ITVTG HUB</span>
        </Link>

        {/* Middle: Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(link => (
            <Link key={link.href} to={link.href} className="text-sm font-semibold text-slate-600 hover:text-sky-600 transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          {!user ? (
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" onClick={() => navigate("/login")} className="font-bold text-slate-600">Đăng nhập</Button>
              <Button onClick={() => navigate("/register")} className="font-bold shadow-xs">Đăng ký</Button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-4">
              {/* Notification Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-slate-900 rounded-full">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 border-2 border-white animate-pulse" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0 overflow-hidden shadow-lg border-slate-100 rounded-xl">
                  <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800">Thông báo</span>
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="h-auto p-0 text-sky-600 hover:text-sky-700 text-xs">
                        <CheckCheck className="h-3 w-3 mr-1" /> Đánh dấu đã đọc
                      </Button>
                    )}
                  </div>
                  <div className="max-h-[300px] overflow-y-auto no-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-sm text-slate-500">Bạn không có thông báo nào.</div>
                    ) : (
                      <div className="flex flex-col divide-y divide-slate-50">
                        {notifications.map(n => (
                          <div key={n._id} className={`p-4 text-sm ${n.isRead ? 'bg-white text-slate-500' : 'bg-sky-50/50 text-slate-800 font-medium'}`}>
                            {n.message}
                            <div className="text-[10px] text-slate-400 mt-1.5">{new Date(n.createdAt).toLocaleString('vi-VN')}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {/* User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="pl-1 pr-2 py-1 h-auto gap-2 hover:bg-slate-100 rounded-full">
                    <Avatar className="h-8 w-8 border border-slate-200 shadow-sm">
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback className="bg-sky-100 text-sky-700 font-bold">{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-bold text-slate-700">{user.username}</span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg border-slate-100 p-2">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-bold text-slate-900 leading-none">{user.username}</p>
                      <p className="text-xs text-slate-500 leading-none">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="my-2" />
                  {USER_MENU[user.role || 'USER']?.map((item, idx) => (
                    <DropdownMenuItem key={idx} onClick={() => navigate(item.href)} className="cursor-pointer py-2 text-slate-600 font-medium rounded-lg hover:bg-slate-50">
                      {item.icon} {item.label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer py-2 text-rose-600 font-bold rounded-lg hover:bg-rose-50 focus:bg-rose-50 focus:text-rose-700">
                    <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Mobile Menu Trigger */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-slate-600">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] border-l-slate-200 bg-white p-6 flex flex-col gap-6">
              <SheetHeader className="text-left">
                <SheetTitle className="font-bold text-xl text-slate-900 flex items-center gap-2">
                   <Trophy className="h-5 w-5 text-sky-600" /> ITVTG HUB
                </SheetTitle>
                <SheetDescription className="text-xs text-slate-500">Điều hướng hệ thống</SheetDescription>
              </SheetHeader>
              
              <nav className="flex flex-col gap-4 mt-4">
                {NAV_LINKS.map(link => (
                  <Link key={link.href} to={link.href} onClick={() => setIsMobileMenuOpen(false)} className="text-base font-bold text-slate-700 hover:text-sky-600 pb-2 border-b border-slate-50">
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-auto flex flex-col gap-3 pt-6 border-t border-slate-100">
                {!user ? (
                  <>
                    <Button variant="outline" className="w-full justify-center font-bold" onClick={() => { setIsMobileMenuOpen(false); navigate("/login"); }}>Đăng nhập</Button>
                    <Button className="w-full justify-center font-bold" onClick={() => { setIsMobileMenuOpen(false); navigate("/register"); }}>Đăng ký</Button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                       <Avatar className="h-10 w-10 border border-slate-200 shadow-sm">
                         <AvatarImage src={user.avatarUrl} />
                         <AvatarFallback className="bg-sky-100 text-sky-700 font-bold">{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                       </Avatar>
                       <div>
                         <p className="text-sm font-bold text-slate-900">{user.username}</p>
                         <Badge variant="outline" className="text-[10px] uppercase mt-0.5">{user.role}</Badge>
                       </div>
                    </div>
                    {USER_MENU[user.role || 'USER']?.map((item, idx) => (
                       <Button key={idx} variant="ghost" className="w-full justify-start font-bold text-slate-600" onClick={() => { setIsMobileMenuOpen(false); navigate(item.href); }}>
                         {item.icon} {item.label}
                       </Button>
                    ))}
                    <Button variant="destructive" className="w-full justify-center font-bold mt-2" onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}>
                      <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}