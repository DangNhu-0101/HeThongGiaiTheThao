import { Clock3, LifeBuoy, Mail, MapPin, MessageSquareText, Phone, Send } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PublicHero from "@/components/layout/PublicHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const contactItems = [
  { icon: MapPin, label: "Địa chỉ", value: import.meta.env.VITE_CONTACT_ADDRESS || "Địa chỉ liên hệ chưa cấu hình", tone: "bg-red-50 text-primary" },
  { icon: Mail, label: "Email", value: import.meta.env.VITE_CONTACT_EMAIL || "Email hỗ trợ chưa cấu hình", tone: "bg-blue-50 text-blue-700" },
  { icon: Phone, label: "Số điện thoại", value: import.meta.env.VITE_CONTACT_PHONE || "Số điện thoại chưa cấu hình", tone: "bg-emerald-50 text-emerald-700" },
  { icon: Clock3, label: "Giờ làm việc", value: "Thứ 2 - Thứ 7, 08:00 - 17:30", tone: "bg-slate-100 text-slate-700" },
];

const ContactPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="page-fade">
        <PublicHero
          eyebrow="Liên hệ"
          title="Liên hệ với chúng tôi"
          description="Gửi thông tin nhu cầu tổ chức, hỗ trợ kỹ thuật hoặc góp ý trải nghiệm. Đội ngũ TMS sẽ phản hồi trong thời gian sớm nhất."
          imageAlt="Sân vận động"
        >
          <MessageSquareText className="size-16 text-white" />
          <p className="mt-4 max-w-sm text-xl font-extrabold">Luôn sẵn sàng hỗ trợ ban tổ chức trong suốt mùa giải.</p>
        </PublicHero>

        <section className="section-y page-shell grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <form className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] sm:p-6">
            <div className="mb-6">
              <span className="section-kicker">Gửi tin nhắn</span>
              <h2 className="mt-3 text-2xl font-extrabold">Gửi thông tin cho chúng tôi</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-semibold">Họ và tên <span className="text-primary">*</span><Input placeholder="Nhập họ và tên của bạn" /></label>
              <label className="space-y-2 text-sm font-semibold">Email <span className="text-primary">*</span><Input type="email" placeholder="Nhập email của bạn" /></label>
              <label className="space-y-2 text-sm font-semibold">Số điện thoại<Input type="tel" placeholder="Nhập số điện thoại" /></label>
              <label className="space-y-2 text-sm font-semibold">Chủ đề <span className="text-primary">*</span>
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option>Tư vấn tổ chức giải</option>
                  <option>Hỗ trợ kỹ thuật</option>
                  <option>Góp ý hệ thống</option>
                </select>
              </label>
              <label className="space-y-2 text-sm font-semibold md:col-span-2">Nội dung <span className="text-primary">*</span><Textarea rows={6} placeholder="Nhập nội dung tin nhắn của bạn..." /></label>
            </div>

            <Button type="button" className="mt-6 w-full">Gửi tin nhắn <Send className="size-4" /></Button>
          </form>

          <div className="space-y-4">
            <span className="section-kicker">Thông tin liên hệ</span>
            {contactItems.map((item) => (
              <div key={item.label} className="surface-card flex gap-4 rounded-2xl p-5">
                <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${item.tone}`}>
                  <item.icon className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">{item.label}</p>
                  <p className="mt-1 font-bold text-foreground">{item.value}</p>
                </div>
              </div>
            ))}

            <div className="deep-band rounded-2xl p-5 text-white shadow-[var(--shadow-soft)]">
              <LifeBuoy className="size-8 text-white" />
              <h3 className="mt-3 text-lg font-extrabold">Cần hỗ trợ nhanh?</h3>
              <p className="mt-2 text-sm leading-6 text-white/76">Truy cập trung tâm trợ giúp để tìm câu trả lời nhanh nhất.</p>
              <Button type="button" variant="outline" className="mt-4 border-white/20 bg-white/10 text-white hover:bg-white hover:text-header">
                Tới trung tâm trợ giúp
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
