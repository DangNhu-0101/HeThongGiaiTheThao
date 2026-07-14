import { Globe2, Mail, MapPin, MessagesSquare, Phone, Send, Trophy } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { canManageTournaments, ORGANIZER_ROLES } from "@/libs/auth";
import { useAuthStore } from "@/stores/useAuthStore";

type FooterLink =
  | { label: string; to: string; action?: never }
  | { label: string; action: "organizer"; to?: never };

const footerGroups: Array<{ title: string; links: FooterLink[] }> = [
  {
    title: "Giải đấu",
    links: [
      { label: "Tất cả giải đấu", to: "/tournaments" },
      { label: "Sự kiện sắp diễn ra", to: "/tournaments?status=upcoming" },
      { label: "Đội của tôi", to: "/my-teams" },
      { label: "Tìm đội", to: "/teams/find" },
    ],
  },
  {
    title: "Hỗ trợ",
    links: [
      { label: "Tin tức", to: "/news" },
      { label: "Trung tâm liên hệ", to: "/contact" },
      { label: "Điều khoản sử dụng", to: "/contact" },
      { label: "Chính sách bảo mật", to: "/contact" },
    ],
  },
  {
    title: "Về chúng tôi",
    links: [
      { label: "Giới thiệu TMS", to: "/about" },
      { label: "Liên hệ", to: "/contact" },
      { label: "Tạo giải đấu", action: "organizer" },
      { label: "Quản lý Ban tổ chức", action: "organizer" },
    ],
  },
];

const contactInfo = [
  { icon: MapPin, value: import.meta.env.VITE_CONTACT_ADDRESS || "Địa chỉ liên hệ chưa cấu hình" },
  { icon: Mail, value: import.meta.env.VITE_CONTACT_EMAIL || "Email hỗ trợ chưa cấu hình" },
  { icon: Phone, value: import.meta.env.VITE_CONTACT_PHONE || "Số điện thoại chưa cấu hình" },
];

const Footer = () => {
  const navigate = useNavigate();
  const { accessToken, user, initialized } = useAuthStore();

  const openOrganizerArea = () => {
    if (!initialized) {
      toast.info("Đang kiểm tra phiên đăng nhập, vui lòng thử lại sau giây lát.");
      return;
    }
    if (!accessToken || !user) {
      navigate("/login", { state: { from: "/org/tournaments", requiredRoles: ORGANIZER_ROLES } });
      return;
    }
    if (!canManageTournaments(user.roles)) {
      toast.error("Tài khoản của bạn chưa có quyền Ban tổ chức để quản lý giải đấu.");
      navigate("/profile");
      return;
    }
    navigate("/org/tournaments");
  };

  return (
    <footer className="mt-10 overflow-hidden bg-footer-bg text-footer-foreground">
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
        <div className="page-shell py-14">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_2fr]">
            <div className="space-y-6">
              <Link to="/" className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20">
                <div className="flex size-11 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15">
                  <Trophy className="size-5" />
                </div>
                <span>
                  <span className="block text-lg font-extrabold text-white">TMS</span>
                  <span className="block text-xs font-semibold uppercase text-white/55">
                    Tournament Suite
                  </span>
                </span>
              </Link>
              <p className="max-w-md text-sm font-normal leading-7 text-footer-foreground/78">
                Nền tảng quản lý giải đấu thể thao: đăng ký, xếp lịch, vận hành trận đấu, theo dõi kết quả và báo cáo trên một giao diện thống nhất.
              </p>
              <div className="grid gap-3 text-sm text-footer-foreground/78">
                {contactInfo.map((item) => (
                  <span key={item.value} className="flex items-center gap-2">
                    <item.icon className="size-4 text-primary" /> {item.value}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-8 sm:grid-cols-3">
              {footerGroups.map((group) => (
                <div key={group.title} className="space-y-4">
                  <h4 className="border-l-2 border-primary pl-3 text-xs font-bold uppercase text-white">
                    {group.title}
                  </h4>
                  <ul className="space-y-3 text-sm">
                    {group.links.map((link) => (
                      <li key={link.label}>
                        {link.to ? (
                          <Link to={link.to} className="text-footer-foreground/70 transition-colors hover:text-primary focus-visible:outline-none focus-visible:text-primary">
                            {link.label}
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={openOrganizerArea}
                            className="text-left text-footer-foreground/70 transition-colors hover:text-primary focus-visible:outline-none focus-visible:text-primary"
                          >
                            {link.label}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-5 border-t border-white/10 pt-6 text-xs text-footer-foreground/60 sm:flex-row sm:items-center sm:justify-between">
            <span>&copy; {new Date().getFullYear()} TMS Tournament Suite. All rights reserved.</span>
            <div className="flex items-center gap-2">
              {[MessagesSquare, Send, Globe2].map((Icon, index) => (
                <Link
                  key={index}
                  to="/contact"
                  className="flex size-9 items-center justify-center rounded-xl bg-white/6 text-footer-foreground transition-all hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
                  aria-label="Kênh liên hệ TMS"
                >
                  <Icon className="size-4" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
