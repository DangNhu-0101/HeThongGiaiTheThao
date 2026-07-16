import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ChevronDown, Clock3, Mail, MapPin, Phone, Send, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PublicHero from "@/components/layout/PublicHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { contactMessageService, type ContactAttachment } from "@/services/contactMessageService";
import { systemSettingsService, type SystemSettings } from "@/services/systemSettingsService";
import { uploadService, validateImageFile } from "@/services/uploadService";

const contactHero = "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1800&q=80";

const faqItems = [
  ["Tôi có thể yêu cầu hỗ trợ tạo giải đấu ở đâu?", "Bạn có thể gửi thông tin qua form liên hệ. Đội ngũ vận hành sẽ phản hồi qua email hoặc số điện thoại đã cung cấp."],
  ["TMS có hỗ trợ upload tài liệu hoặc hình ảnh không?", "Form liên hệ hỗ trợ ảnh JPG, PNG và WEBP để bạn gửi ảnh chụp lỗi, poster hoặc thông tin liên quan."],
  ["Bao lâu tôi sẽ nhận được phản hồi?", "Thông thường phản hồi được gửi trong giờ hành chính. Các yêu cầu khẩn sẽ được ưu tiên xử lý sớm hơn."],
];

const ContactPage = () => {
  const [settings, setSettings] = useState<SystemSettings>(systemSettingsService.fallback);
  const [form, setForm] = useState({ fullName: "", email: "", phoneNumber: "", subject: "", content: "" });
  const [files, setFiles] = useState<File[]>([]);
  const [openFaq, setOpenFaq] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);

  useEffect(() => {
    systemSettingsService.getPublic().then(setSettings).catch(() => undefined);
  }, []);

  useEffect(() => () => previews.forEach((item) => URL.revokeObjectURL(item.url)), [previews]);

  const contactItems = [
    { icon: MapPin, label: "Địa chỉ", value: settings.contactAddress || "Địa chỉ liên hệ chưa cấu hình", tone: "bg-red-50 text-primary" },
    { icon: Mail, label: "Email", value: settings.supportEmail || "Email hỗ trợ chưa cấu hình", tone: "bg-blue-50 text-blue-700" },
    { icon: Phone, label: "Số điện thoại", value: settings.contactPhone || "Số điện thoại chưa cấu hình", tone: "bg-emerald-50 text-emerald-700" },
    { icon: Clock3, label: "Giờ làm việc", value: "Thứ 2 - Thứ 7, 08:00 - 17:30", tone: "bg-slate-100 text-slate-700" },
  ];

  const onSelectFiles = (selected: FileList | null) => {
    if (!selected) return;
    const next = Array.from(selected).slice(0, 5 - files.length);
    const invalid = next.map((file) => validateImageFile(file)).find(Boolean);
    if (invalid) {
      toast.error(invalid);
      return;
    }
    setFiles((current) => [...current, ...next].slice(0, 5));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.fullName.trim() || !form.email.trim() || !form.subject.trim() || !form.content.trim()) {
      toast.error("Vui lòng nhập đầy đủ họ tên, email, tiêu đề và nội dung.");
      return;
    }
    setSubmitting(true);
    try {
      let attachments: ContactAttachment[] = [];
      if (files.length > 0) attachments = await uploadService.contactImages(files);
      await contactMessageService.create({ ...form, attachments });
      toast.success("Đã gửi tin nhắn liên hệ. Chúng tôi sẽ phản hồi sớm.");
      setForm({ fullName: "", email: "", phoneNumber: "", subject: "", content: "" });
      setFiles([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể gửi tin nhắn. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="page-fade">
        <PublicHero
          eyebrow="Liên hệ"
          title="Liên hệ với chúng tôi"
          description="Gửi nhu cầu tổ chức, hỗ trợ kỹ thuật hoặc góp ý trải nghiệm. Đội ngũ TMS sẽ phản hồi trong thời gian sớm nhất."
          imageSrc={contactHero}
          imageAlt="Đội ngũ tổ chức sự kiện thể thao"
        />

        <section className="section-y page-shell grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] sm:p-6">
            <div className="mb-6">
              <span className="section-kicker">Gửi tin nhắn</span>
              <h2 className="mt-3 text-2xl font-bold">Gửi thông tin cho chúng tôi</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-semibold">Họ và tên <span className="text-primary">*</span><Input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} placeholder="Nhập họ và tên của bạn" /></label>
              <label className="space-y-2 text-sm font-semibold">Email <span className="text-primary">*</span><Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Nhập email của bạn" /></label>
              <label className="space-y-2 text-sm font-semibold">Số điện thoại<Input type="tel" value={form.phoneNumber} onChange={(event) => setForm({ ...form, phoneNumber: event.target.value })} placeholder="Nhập số điện thoại" /></label>
              <label className="space-y-2 text-sm font-semibold">Tiêu đề <span className="text-primary">*</span><Input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} placeholder="Ví dụ: Hỗ trợ tạo giải đấu" /></label>
              <label className="space-y-2 text-sm font-semibold md:col-span-2">Nội dung <span className="text-primary">*</span><Textarea rows={6} value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} placeholder="Nhập nội dung tin nhắn của bạn..." /></label>
            </div>

            <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/30 p-4">
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 text-center text-sm font-semibold text-muted-foreground">
                <Upload className="h-5 w-5 text-primary" />
                Tải ảnh đính kèm JPG, PNG hoặc WEBP, tối đa 5 ảnh
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(event) => onSelectFiles(event.target.files)} />
              </label>
              {previews.length > 0 && (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {previews.map((item, index) => (
                    <div key={item.url} className="relative overflow-hidden rounded-lg border border-border">
                      <img src={item.url} alt={`Ảnh đính kèm ${index + 1}`} className="h-28 w-full object-cover" />
                      <button type="button" onClick={() => setFiles((current) => current.filter((file) => file !== item.file))} className="absolute right-2 top-2 rounded bg-white/90 p-1 text-destructive shadow" aria-label="Xóa ảnh">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" disabled={submitting} className="mt-6 w-full">{submitting ? "Đang gửi..." : "Gửi tin nhắn"} <Send className="size-4" /></Button>
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

            <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
              <span className="section-kicker">FAQ</span>
              <div className="mt-4 divide-y divide-border">
                {faqItems.map(([question, answer], index) => (
                  <div key={question} className="py-3">
                    <button type="button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)} className="flex w-full items-center justify-between gap-3 text-left font-bold">
                      {question}
                      <ChevronDown className={`h-4 w-4 transition-transform ${openFaq === index ? "rotate-180" : ""}`} />
                    </button>
                    <div className={`grid transition-all duration-200 ${openFaq === index ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                      <p className="overflow-hidden pt-2 text-sm leading-6 text-muted-foreground">{answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] lg:col-span-2">
            <span className="section-kicker">Bản đồ</span>
            <h2 className="mt-3 text-2xl font-bold">Vị trí liên hệ</h2>
            <div className="mt-4 h-[320px] w-full overflow-hidden rounded-xl sm:h-[420px]">
              <iframe
                title="Vị trí liên hệ"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3924.4393348119615!2d107.08234661012277!3d10.386637966220656!2m3!1f0!2f0!3f0!3m2!1i1024!1i768!4f13.1!3m3!1m2!1s0x31756e305b423d3b%3A0x53d64d03b2d9dc8b!2sSupply%20Base%20-%20POVO!5e0!3m2!1svi!2s!4v1784038141205!5m2!1svi!2s"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
