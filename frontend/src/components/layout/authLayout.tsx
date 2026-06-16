import { Trophy, Calendar, LineChart, Users, ShieldCheck } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen w-full flex bg-muted/10">
      
      {/* CỘT TRÁI: Branding & Features (Chỉ hiện trên Desktop) */}
      {!isMobile && (
        <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#00529B] to-[#003366] text-white p-12 flex-col justify-between relative overflow-hidden">
          {/* Decorative blurs */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-400/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-16">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                <Trophy className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h1 className="font-black text-xl tracking-wider leading-none">TMS</h1>
                <p className="text-[10px] uppercase font-bold tracking-widest text-white/70">Tournament Management</p>
              </div>
            </div>

            <div className="inline-block bg-yellow-400/20 border border-yellow-400/50 text-yellow-300 text-xs font-bold px-3 py-1.5 rounded-full mb-6 uppercase tracking-wider">
              ⚙ Mùa giải hè 2026 đang diễn ra
            </div>

            <h2 className="text-5xl font-black leading-tight mb-6">
              Nền tảng tổ chức<br />
              <span className="text-yellow-400">giải đấu thể thao</span><br />
              đa môn hàng đầu
            </h2>
            
            <p className="text-lg text-white/80 max-w-md mb-12 leading-relaxed">
              Quản lý toàn diện các giải đấu thể thao từ lịch thi đấu, kết quả, đến thống kê — tất cả trong một nền tảng thống nhất và chuyên nghiệp.
            </p>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 gap-4 max-w-lg">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-2xl">
                <Calendar className="w-6 h-6 text-blue-300 mb-3" />
                <h4 className="font-bold text-sm">Lịch thi đấu</h4>
                <p className="text-[10px] text-white/70 mt-1">Quản lý & sắp xếp tự động</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-2xl">
                <LineChart className="w-6 h-6 text-green-300 mb-3" />
                <h4 className="font-bold text-sm">Thống kê thời gian thực</h4>
                <p className="text-[10px] text-white/70 mt-1">Phân tích & báo cáo chi tiết</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-2xl">
                <Users className="w-6 h-6 text-orange-300 mb-3" />
                <h4 className="font-bold text-sm">Quản lý đội & VĐV</h4>
                <p className="text-[10px] text-white/70 mt-1">Hồ sơ & theo dõi hiệu suất</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-2xl">
                <ShieldCheck className="w-6 h-6 text-red-300 mb-3" />
                <h4 className="font-bold text-sm">Bảo mật cao cấp</h4>
                <p className="text-[10px] text-white/70 mt-1">Phân quyền & kiểm soát truy cập</p>
              </div>
            </div>
          </div>

          {/* Stats Footer */}
          <div className="relative z-10 flex gap-12 pt-8 border-t border-white/20 mt-12">
            <div>
              <p className="text-3xl font-black">2,400+</p>
              <p className="text-xs text-white/70">Giải đấu đã tổ chức</p>
            </div>
            <div>
              <p className="text-3xl font-black">150K+</p>
              <p className="text-xs text-white/70">Vận động viên</p>
            </div>
            <div>
              <p className="text-3xl font-black">98.5%</p>
              <p className="text-xs text-white/70">Uptime hệ thống</p>
            </div>
          </div>
        </div>
      )}

      {/* CỘT PHẢI: Form Container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 relative">
         {/* Nền xanh nhạt ẩn hiện cho Mobile */}
         {isMobile && <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-[#003366] -z-10"></div>}
         
         <div className="w-full max-w-[440px] z-10">
           {children}
         </div>
      </div>

    </div>
  );
};

export default AuthLayout;