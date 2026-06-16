import { Link } from "react-router-dom";
import {CircleAlertIcon} from "lucide-react";
const Footer = () => {
  return (
    <footer className="bg-footer-bg text-footer-foreground py-16 px-8 mt-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-10">
        
        {/* Cột 1: Thông tin thương hiệu & Mạng xã hội */}
        <div className="md:col-span-2 space-y-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center font-bold text-white shadow-lg">
              TMS
            </div>
            <span className="font-bold text-xl tracking-wider text-white">
              TMS <span className="text-xs block text-muted-foreground font-normal tracking-normal">TOURNAMENT APP</span>
            </span>
          </Link>
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            Nền tảng quản lý giải đấu đa môn thể thao chuyên nghiệp hàng đầu, được các ban tổ chức giải đấu trên toàn thế giới tin dùng.
          </p>
          <div className="flex items-center gap-4 pt-2">
            <a href="#" className="w-9 h-9 bg-white/5 hover:bg-primary hover:text-white rounded-lg flex items-center justify-center transition-all text-footer-foreground">
              <CircleAlertIcon className="w-4 h-4" />
            </a>
            <a href="#" className="w-9 h-9 bg-white/5 hover:bg-primary hover:text-white rounded-lg flex items-center justify-center transition-all text-footer-foreground">
              <CircleAlertIcon className="w-4 h-4" />
            </a>
            <a href="#" className="w-9 h-9 bg-white/5 hover:bg-primary hover:text-white rounded-lg flex items-center justify-center transition-all text-footer-foreground">
              <CircleAlertIcon className="w-4 h-4" />
            </a>
            <a href="#" className="w-9 h-9 bg-white/5 hover:bg-primary hover:text-white rounded-lg flex items-center justify-center transition-all text-footer-foreground">
              <CircleAlertIcon className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Cột 2: Danh mục Giải đấu */}
        <div className="space-y-4">
          <h4 className="text-white font-bold text-xs uppercase tracking-widest border-l-2 border-primary pl-2">
            Giải đấu
          </h4>
          <ul className="space-y-3 text-sm">
            <li>
              <a href="#" className="hover:text-white text-muted-foreground transition-colors">Tất cả giải đấu</a>
            </li>
            <li>
              <a href="#" className="hover:text-white text-muted-foreground transition-colors">Trận đấu trực tiếp</a>
            </li>
            <li>
              <a href="#" className="hover:text-white text-muted-foreground transition-colors">Sự kiện sắp diễn ra</a>
            </li>
            <li>
              <a href="#" className="hover:text-white text-muted-foreground transition-colors">Bảng xếp hạng</a>
            </li>
            <li>
              <a href="#" className="hover:text-white text-muted-foreground transition-colors">Sơ đồ thi đấu</a>
            </li>
          </ul>
        </div>

        {/* Cột 3: Dành cho Ban tổ chức */}
        <div className="space-y-4">
          <h4 className="text-white font-bold text-xs uppercase tracking-widest border-l-2 border-primary pl-2">
            Ban tổ chức
          </h4>
          <ul className="space-y-3 text-sm">
            <li>
              <a href="#" className="hover:text-white text-muted-foreground transition-colors">Bảng điều khiển</a>
            </li>
            <li>
              <a href="#" className="hover:text-white text-muted-foreground transition-colors">Tạo giải đấu mới</a>
            </li>
            <li>
              <a href="#" className="hover:text-white text-muted-foreground transition-colors">Quản lý đội thi</a>
            </li>
            <li>
              <a href="#" className="hover:text-white text-muted-foreground transition-colors">Lập lịch thi đấu</a>
            </li>
            <li>
              <a href="#" className="hover:text-white text-muted-foreground transition-colors">Báo cáo thống kê</a>
            </li>
          </ul>
        </div>

        {/* Cột 4: Hỗ trợ & Điều khoản */}
        <div className="space-y-4">
          <h4 className="text-white font-bold text-xs uppercase tracking-widest border-l-2 border-primary pl-2">
            Hỗ trợ
          </h4>
          <ul className="space-y-3 text-sm">
            <li>
              <a href="#" className="hover:text-white text-muted-foreground transition-colors">Tài liệu hướng dẫn</a>
            </li>
            <li>
              <a href="#" className="hover:text-white text-muted-foreground transition-colors">Trung tâm trợ giúp</a>
            </li>
            <li>
              <a href="#" className="hover:text-white text-muted-foreground transition-colors">Liên hệ với chúng tôi</a>
            </li>
            <li>
              <a href="#" className="hover:text-white text-muted-foreground transition-colors">Chính sách bảo mật</a>
            </li>
            <li>
              <a href="#" className="hover:text-white text-muted-foreground transition-colors">Điều khoản dịch vụ</a>
            </li>
          </ul>
        </div>

      </div>

      {/* Thanh bản quyền phía dưới */}
      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <div>
          &copy; {new Date().getFullYear()} TMS Tournament App. Tất cả các quyền được bảo lưu.
        </div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white transition-colors">Quy định giải đấu</a>
          <a href="#" className="hover:text-white transition-colors">Bảo mật dữ liệu</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;