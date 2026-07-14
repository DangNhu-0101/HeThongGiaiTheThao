import { Loader2, Settings } from "lucide-react";
import { useEffect, useState } from "react";

const AdminSettingsPage = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => setLoading(false), 150);
    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-12">
      <section className="rounded-2xl bg-header p-6 text-white shadow-lg">
        <p className="text-[10px] font-bold uppercase text-white/60">Quản trị hệ thống</p>
        <h1 className="mt-1 text-3xl font-extrabold uppercase tracking-normal">Cài đặt hệ thống</h1>
        <p className="mt-2 text-sm text-white/70">Khu vực cấu hình vận hành chung của nền tảng.</p>
      </section>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
          <Loader2 className="mx-auto mb-3 size-6 animate-spin text-primary" /> Đang tải cài đặt...
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
          <Settings className="mx-auto mb-3 size-10 text-primary" />
          <h2 className="text-xl font-extrabold text-foreground">Chưa có cấu hình công khai</h2>
          <p className="mt-2 text-sm">Các tùy chọn hệ thống sẽ hiển thị tại đây khi backend cung cấp cấu hình tương ứng.</p>
        </div>
      )}
    </div>
  );
};

export default AdminSettingsPage;
