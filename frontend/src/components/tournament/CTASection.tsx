import { Headset, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { canManageTournaments, ORGANIZER_ROLES } from "@/libs/auth";
import { useAuthStore } from "@/stores/useAuthStore";

const CTASection = () => {
  const navigate = useNavigate();
  const { accessToken, user, initialized } = useAuthStore();

  const startOrganization = () => {
    const target = "/org/tournaments/create";
    if (!initialized) {
      toast.info("Đang kiểm tra phiên đăng nhập, vui lòng thử lại sau giây lát.");
      return;
    }
    if (!accessToken || !user) {
      navigate("/login", { state: { from: target, requiredRoles: ORGANIZER_ROLES } });
      return;
    }
    if (!canManageTournaments(user.roles)) {
      toast.info("Tài khoản của bạn chưa có quyền Ban tổ chức. Vui lòng hoàn thiện hồ sơ hoặc gửi yêu cầu cấp quyền.");
      navigate("/profile", { state: { requestedRole: "organization", from: target } });
      return;
    }
    navigate(target);
  };

  return (
    <section className="mt-12 bg-header text-white">
      <div className="page-shell grid gap-8 py-16 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/10 px-3 py-1.5 text-xs font-bold text-accent">
            <Sparkles className="size-3.5" /> Sẵn sàng cho mùa giải mới
          </span>
          <h2 className="mt-4 max-w-3xl text-3xl font-black leading-tight md:text-4xl">
            Bạn đã sẵn sàng tổ chức một giải đấu chuyên nghiệp?
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/76 md:text-base">
            Gia nhập cộng đồng ban tổ chức đang dùng hệ thống để quản lý đăng ký, lịch thi đấu, kết quả và báo cáo trong một nền tảng thống nhất.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
          <Button onClick={startOrganization} className="h-12 bg-accent px-6 text-base font-bold text-accent-foreground shadow-lg shadow-accent/20 hover:bg-accent/90">
            Bắt đầu tổ chức
          </Button>
          <Button variant="outline" onClick={() => navigate("/contact")} className="h-12 border-white/22 bg-white/8 px-6 text-base text-white hover:bg-white hover:text-header">
            <Headset className="size-4" /> Liên hệ tư vấn
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
