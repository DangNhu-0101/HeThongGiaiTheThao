import { Calendar, LineChart, ShieldCheck, Trophy, Users } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen w-full bg-background">
      {!isMobile && (
        <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-header p-12 text-white lg:flex">
          <img
            src="https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=1400&q=86"
            alt="Sân thể thao"
            className="absolute inset-0 h-full w-full object-cover opacity-28"
          />
          <div className="absolute inset-0 hero-wash" />

          <div className="relative z-10">
            <div className="mb-16 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg border border-white/20 bg-white/12 text-accent backdrop-blur-sm">
                <Trophy className="size-5" />
              </div>
              <div>
                <h1 className="text-xl font-black leading-none">TMS</h1>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">Tournament Suite</p>
              </div>
            </div>

            <div className="mb-6 inline-flex rounded-full border border-accent/45 bg-accent/18 px-3 py-1.5 text-xs font-bold uppercase text-accent">
              Mùa giải hè 2026 đang diễn ra
            </div>

            <h2 className="mb-6 text-5xl font-black leading-tight">
              Nền tảng tổ chức
              <br />
              <span className="text-accent">giải đấu thể thao</span>
              <br />
              đa môn hiện đại
            </h2>

            <p className="mb-12 max-w-md text-lg leading-relaxed text-subtitle">
              Quản lý toàn diện giải đấu từ lịch thi đấu, kết quả đến thống kê trong một nền tảng thống nhất.
            </p>

            <div className="grid max-w-lg grid-cols-2 gap-4">
              {[
                [Calendar, "Lịch thi đấu", "Sắp xếp rõ ràng"],
                [LineChart, "Thống kê realtime", "Báo cáo nhanh"],
                [Users, "Đội & VĐV", "Hồ sơ tập trung"],
                [ShieldCheck, "Phân quyền", "Kiểm soát truy cập"],
              ].map(([Icon, title, desc]) => (
                <div key={String(title)} className="rounded-lg border border-white/16 bg-white/12 p-4 backdrop-blur-sm">
                  <Icon className="mb-3 size-6 text-accent" />
                  <h4 className="text-sm font-bold">{title as string}</h4>
                  <p className="mt-1 text-xs text-white/70">{desc as string}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-12 flex gap-10 border-t border-white/16 pt-8">
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

      <div className="relative flex w-full items-center justify-center p-4 sm:p-8 lg:w-1/2">
        {isMobile && <div className="absolute inset-0 -z-10 bg-gradient-to-br from-header to-hero-end" />}
        <div className="z-10 w-full max-w-[440px]">{children}</div>
      </div>
    </div>
  );
};

export default AuthLayout;
