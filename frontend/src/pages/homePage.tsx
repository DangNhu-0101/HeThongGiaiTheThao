import { useEffect } from "react";
import { BarChart3, CalendarClock, CheckCircle2, ClipboardList, Flag, LineChart, ShieldCheck, Trophy, UsersRound } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import SportsCarousel from "@/components/home/SportsCarousel";
import AllTournaments from "@/components/home/AllTournaments";
import UpcomingMatches from "@/components/home/UpcomingMatches";
import { useHomeStore } from "@/stores/useHomeStore";

const features = [
  {
    icon: Trophy,
    title: "Quản lý giải đấu",
    description: "Theo dõi thông tin giải, hạng mục, đội đăng ký và trạng thái vận hành trong cùng một luồng làm việc.",
  },
  {
    icon: CalendarClock,
    title: "Lịch thi đấu thông minh",
    description: "Sắp xếp trận, sân, khung giờ và vòng đấu rõ ràng để ban tổ chức dễ công bố và điều phối.",
  },
  {
    icon: BarChart3,
    title: "Báo cáo trực quan",
    description: "Tổng hợp số liệu đội tham gia, lịch đấu, kết quả và bảng xếp hạng thành thông tin dễ đọc.",
  },
  {
    icon: ShieldCheck,
    title: "Phân quyền an toàn",
    description: "Tách bạch vai trò ban tổ chức, vận động viên, trọng tài và quản trị viên theo đúng phạm vi thao tác.",
  },
];

const process = [
  ["01", "Khởi tạo giải đấu", ClipboardList],
  ["02", "Mở đăng ký", UsersRound],
  ["03", "Xếp lịch thi đấu", CalendarClock],
  ["04", "Thi đấu", Flag],
  ["05", "Báo cáo và bảng xếp hạng", LineChart],
  ["06", "Công bố và kết thúc", CheckCircle2],
] as const;

const HomePage = () => {
  const { tournaments, upcomingMatches, sports, stats, loading, error, fetchHomeData } = useHomeStore();

  useEffect(() => {
    void fetchHomeData();
  }, [fetchHomeData]);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <Header />
      <main className="page-fade">
        <Hero stats={stats} loading={loading} error={error} />

        <section id="features" className="section-y page-shell">
          <div className="mb-10 grid gap-4 md:grid-cols-[1fr_0.7fr] md:items-end">
            <div>
              <span className="section-kicker">Tính năng nổi bật</span>
              <h2 className="mt-4 max-w-3xl text-[clamp(1.75rem,4vw,2.625rem)] font-extrabold tracking-normal">
                Đầy đủ chức năng cho ban tổ chức, vận động viên và khán giả
              </h2>
            </div>
            <p className="text-sm font-normal leading-7 text-muted-foreground">
              Các công cụ chính tập trung vào tổ chức, vận hành, theo dõi và bảo vệ dữ liệu giải đấu.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature, index) => (
              <article
                key={feature.title}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-ring/35 hover:shadow-[var(--shadow-soft)]"
              >
                <span className="absolute right-5 top-3 text-7xl font-extrabold text-header/[0.06]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="relative">
                  <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground group-hover:bg-red-100 group-hover:text-primary">
                    <feature.icon className="size-5" />
                  </div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="mt-3 text-sm font-normal leading-7 text-muted-foreground">{feature.description}</p>
                  <div className="mt-6 h-1 w-20 rounded-full bg-primary/80" />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="process" className="deep-band section-y text-white">
          <div className="page-shell">
            <div className="mb-12 grid gap-6 lg:grid-cols-[0.8fr_1fr] lg:items-end">
              <div>
                <span className="inline-flex rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase text-white">
                  Quy trình
                </span>
                <h2 className="mt-4 text-[clamp(1.75rem,4vw,2.625rem)] font-extrabold tracking-normal">
                  Quy trình quản lý giải đấu
                </h2>
              </div>
              <p className="max-w-2xl text-sm font-normal leading-7 text-white/72">
                Một luồng vận hành liền mạch từ lúc khởi tạo, mở đăng ký, công bố lịch thi đấu đến tổng kết kết quả.
              </p>
            </div>

            <div className="relative grid gap-4 lg:grid-cols-6">
              <div className="absolute left-0 right-0 top-10 hidden h-px bg-primary/70 lg:block" />
              {process.map(([step, title, Icon]) => (
                <article key={step} className="relative rounded-2xl border border-white/12 bg-white/10 p-5 backdrop-blur">
                  <div className="mb-6 flex items-center justify-between">
                    <span className="text-sm font-extrabold text-primary-light">{step}</span>
                    <span className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15">
                      <Icon className="size-5" />
                    </span>
                  </div>
                  <h3 className="text-base font-bold leading-6">{title}</h3>
                </article>
              ))}
            </div>
          </div>
        </section>

        <SportsCarousel sports={sports} loading={loading} error={error} onRetry={fetchHomeData} />
        <AllTournaments tournaments={tournaments} loading={loading} error={error} onRetry={fetchHomeData} />
        <UpcomingMatches matches={upcomingMatches} loading={loading} error={error} onRetry={fetchHomeData} />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
