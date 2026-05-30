import { Link } from "react-router-dom";
import { MessageCircle, Share2, Globe, Mail, Phone, Trophy, ChevronRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 font-sans border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          
          {/* Cột 1: Brand Info */}
          <div className="flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="h-10 w-10 bg-sky-600 rounded-xl flex items-center justify-center shadow-sm">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <span className="font-extrabold text-2xl text-white tracking-tight">ITVTG HUB</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm mt-2">
              Nền tảng quản lý và tổ chức giải đấu thể thao chuyên nghiệp. Kết nối đam mê, vinh danh người chiến thắng.
            </p>
          </div>

          {/* Cột 2: Quick Links */}
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-white text-lg tracking-wide uppercase mb-2">Liên kết nhanh</h3>
            <div className="flex flex-col gap-3">
              <Link to="/" className="text-sm text-slate-400 hover:text-sky-400 transition-colors flex items-center gap-2 group">
                <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-sky-400 transition-colors" /> Trang chủ
              </Link>
              <Link to="/tournaments" className="text-sm text-slate-400 hover:text-sky-400 transition-colors flex items-center gap-2 group">
                <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-sky-400 transition-colors" /> Các giải đấu
              </Link>
              <Link to="/rules" className="text-sm text-slate-400 hover:text-sky-400 transition-colors flex items-center gap-2 group">
                <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-sky-400 transition-colors" /> Điều lệ hệ thống
              </Link>
            </div>
          </div>

          {/* Cột 3: Contact Info */}
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-white text-lg tracking-wide uppercase mb-2">Thông tin liên hệ</h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0"><Mail className="h-4 w-4 text-sky-400" /></div>
                <span className="hover:text-white transition-colors cursor-pointer">support@itvtg.com</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0"><Phone className="h-4 w-4 text-sky-400" /></div>
                <span className="hover:text-white transition-colors cursor-pointer">0123 456 789 (Hotline)</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom: Copyright & Socials */}
      <div className="bg-slate-950/50 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs font-semibold text-slate-500">© 2026 IT Vũng Tàu Group Tournament. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <a href="#" className="text-slate-500 hover:text-sky-400 transition-colors"><MessageCircle className="h-4 w-4" /></a>
            <a href="#" className="text-slate-500 hover:text-sky-400 transition-colors"><Share2 className="h-4 w-4" /></a>
            <a href="#" className="text-slate-500 hover:text-sky-400 transition-colors"><Globe className="h-4 w-4" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}