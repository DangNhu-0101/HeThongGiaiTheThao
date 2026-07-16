import { useEffect } from "react";
import { BarChart3, CheckCircle2, Medal, ShieldCheck, Trophy } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PublicHero from "@/components/layout/PublicHero";
import { useHomeStore } from "@/stores/useHomeStore";

const heroImage = "https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=1800&q=80";

const values = [
  {
    icon: Trophy,
    title: "Tập trung vào giải đấu",
    description: "TMS gom đăng ký, lịch thi đấu, đội, vận động viên và kết quả vào một không gian vận hành thống nhất.",
  },
  {
    icon: ShieldCheck,
    title: "Phân quyền rõ ràng",
    description: "Mỗi vai trò có trải nghiệm riêng: quản trị hệ thống, ban tổ chức, trọng tài và vận động viên.",
  },
  {
    icon: BarChart3,
    title: "Dữ liệu minh bạch",
    description: "Trạng thái đăng ký, lịch thi đấu và kết quả được trình bày trực quan để ra quyết định nhanh.",
  },
];

const AboutPage = () => {
  const { tournaments, sports, upcomingMatches, fetchHomeData } = useHomeStore();

  useEffect(() => {
    void fetchHomeData();
  }, [fetchHomeData]);

  const teamCount = tournaments.reduce((sum, item) => sum + Number(item.registeredTeams || 0), 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="page-fade">
        <PublicHero
          eyebrow="Về chúng tôi"
          title="Nền tảng quản lý giải đấu thể thao chuyên nghiệp"
          description="Chúng tôi xây dựng hệ thống để giúp ban tổ chức vận hành giải đấu nhanh hơn, minh bạch hơn và mang đến trải nghiệm tốt hơn cho vận động viên."
          imageSrc={heroImage}
          imageAlt="Đội thể thao cùng nhau trước trận đấu"
          stats={[
            { value: tournaments.length, label: "Giải đấu", description: "Đang được tổ chức" },
            { value: teamCount, label: "Đội tham gia", description: "Từ dữ liệu đăng ký" },
            { value: sports.length, label: "Môn thi", description: "Đang cấu hình" },
            { value: upcomingMatches.length, label: "Trận đấu", description: "Sắp diễn ra" },
          ]}
        />

        <section className="section-y page-shell">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <span className="section-kicker">Sứ mệnh</span>
              <h2 className="mt-4 text-3xl font-extrabold">Đưa quy trình tổ chức giải vào một chuẩn vận hành rõ ràng</h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Một giải đấu tốt không chỉ nằm ở trận đấu hay, mà còn ở cách dữ liệu, lịch trình, hồ sơ đội và kết quả được quản lý chính xác, dễ kiểm tra và dễ mở rộng.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {values.map((item) => (
                <article key={item.title} className="surface-card rounded-2xl p-6">
                  <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <item.icon className="size-5" />
                  </div>
                  <h3 className="font-bold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white/74 py-12">
          <div className="page-shell grid gap-5 md:grid-cols-3">
            {["Thiết lập giải nhanh", "Theo dõi tiến độ trực quan", "Dữ liệu sẵn sàng báo cáo"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
                <CheckCircle2 className="size-5 shrink-0 text-success" />
                <span className="font-bold">{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="section-y page-shell">
          <div className="summer-panel rounded-2xl p-7">
            <Medal className="size-10 text-primary" />
            <h2 className="mt-4 text-2xl font-extrabold">Đồng hành cùng ban tổ chức và cộng đồng vận động viên</h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-muted-foreground">
              Hệ thống hướng đến một hệ sinh thái nơi thông tin giải đấu dễ tiếp cận, quy trình đăng ký rõ ràng và mỗi trận đấu đều được ghi nhận chính xác.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;
