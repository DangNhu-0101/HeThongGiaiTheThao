import { Calendar, LineChart, ShieldCheck, Trophy, Users } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSystemSettings } from "@/hooks/useSystemSettings";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const isMobile = useIsMobile();
    const { settings } = useSystemSettings();
    const renderBrandMark = () => (
    <div className="flex size-10 items-center justify-center overflow-hidden rounded-lg bg-primary-dark text-white shadow-sm">
      {settings.logoUrl ? <img src={settings.logoUrl} alt={`Logo ${settings.siteName}`} className="h-full w-full object-contain p-1" /> : <Trophy className="size-5" />}
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      {!isMobile && (
        <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary-dark p-12 text-white lg:flex">
          <img
            src="https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=1400&q=86"
            alt="Sân thể thao"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-primary-dark/70" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(13,36,59,0.95)_0%,rgba(13,36,59,0.84)_48%,rgba(50,89,120,0.58)_100%)]" />

          <div className="relative z-10">
            <div className="mb-16 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg border border-white/20 bg-white/12 text-white backdrop-blur-sm">
                 {renderBrandMark()}
              </div>
              <div>
                 <span className="leading-tight">
                  <span className="block max-w-[11rem] truncate font-heading text-base font-bold tracking-normal text-title text-white">{settings.siteName}</span>
                  <span className="block font-highlight text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Tournament Management System</span>
                </span>
              </div>
            </div>

       

            <h2 className="mb-6 font-heading text-5xl font-bold leading-tight text-white">
              Nền tảng tổ chức
              <br />
              <span className="text-white">giải đấu thể thao</span>
              <br />
              đa môn hiện đại
            </h2>

            <p className="mb-12 max-w-md text-lg font-medium leading-relaxed text-white/84">
              Quản lý toàn diện giải đấu từ lịch thi đấu, kết quả đến thống kê trong một nền tảng thống nhất.
            </p>

            <div className="grid max-w-lg grid-cols-2 gap-4">
              {[
                [Calendar, "Lịch thi đấu", "Sắp xếp rõ ràng"],
                [LineChart, "Thống kê realtime", "Báo cáo nhanh"],
                [Users, "Đội & VĐV", "Hồ sơ tập trung"],
                [ShieldCheck, "Phân quyền", "Kiểm soát truy cập"],
              ].map(([Icon, title, desc]) => (
                <div key={String(title)} className="rounded-lg border border-white/14 bg-primary-dark/58 p-4 text-white shadow-sm backdrop-blur-sm">
                  <Icon className="mb-3 size-6 text-primary-light" />
                  <h4 className="font-heading text-sm font-bold text-white">{title as string}</h4>
                  <p className="mt-1 text-xs text-white/72">{desc as string}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      <div className="relative flex w-full items-center justify-center p-4 sm:p-8 lg:w-1/2">
        {isMobile && <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-dark to-primary" />}
        <div className="z-10 w-full max-w-[440px]">{children}</div>
      </div>
    </div>
  );
};

export default AuthLayout;
