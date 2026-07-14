import {
  Activity,
  ArrowRight,
  PlayCircle,
  Trophy,
  UsersRound,
  UserCheck,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

//import heroImage from "@/backend/uploads/media/hero.png";
import { buttonVariants } from "@/components/ui/button";
import { canManageTournaments, ORGANIZER_ROLES } from "@/libs/auth";
import { cn } from "@/libs/utils";
import { useAuthStore } from "@/stores/useAuthStore";
  
interface HeroStats {
  ongoingTournaments: number;
  totalTeams: number;
  totalSports: number;
  totalAthletesOrRegistrations: number;
}

interface HeroProps {
  stats: HeroStats;
  loading?: boolean;
}

const Hero = ({ stats, loading = false }: HeroProps) => {
  const navigate = useNavigate();
  const { accessToken, user, initialized } = useAuthStore();

  const statItems = [
    {
      value: stats.ongoingTournaments,
      label: "Giải đang diễn ra",
      icon: Trophy,
    },
    {
      value: stats.totalTeams,
      label: "Đội tham gia",
      icon: UsersRound,
    },
    {
      value: stats.totalSports,
      label: "Môn thể thao",
      icon: Activity,
    },
    {
      value: stats.totalAthletesOrRegistrations,
      label: "Lượt đăng ký hợp lệ",
      icon: UserCheck,
    },
  ];

  const handleCreateTournament = () => {
    if (!initialized) {
      toast.info(
        "Đang kiểm tra phiên đăng nhập, vui lòng thử lại sau giây lát.",
      );
      return;
    }

    if (!accessToken || !user) {
      navigate("/login", {
        state: {
          from: "/org/tournaments",
          requiredRoles: ORGANIZER_ROLES,
        },
      });
      return;
    }

    if (!canManageTournaments(user.roles)) {
      toast.error(
        "Tài khoản của bạn chưa có quyền Ban tổ chức để tạo giải đấu.",
      );
      navigate("/profile");
      return;
    }

    navigate("/org/tournaments");
  };

  return (
    <section className="relative isolate overflow-hidden bg-header text-white">
      <img
        //src={heroImage}
        alt="Vận động viên đang thi đấu thể thao"
        className="absolute inset-0 -z-30 h-full w-full object-cover object-[68%_center] sm:object-center"
      />

      {/* Overlay chính: bên trái tối để chữ rõ, bên phải nhẹ để giữ ảnh */}
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(10,42,67,0.96)_0%,rgba(13,52,82,0.90)_38%,rgba(21,76,114,0.68)_66%,rgba(21,76,114,0.30)_100%)]" />

      {/* Lớp chiều sâu phía dưới */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,0,0,0.03)_0%,rgba(0,0,0,0.10)_55%,rgba(5,28,45,0.45)_100%)]" />

      {/* Ánh sáng xanh nhẹ phía phải */}
      <div className="absolute right-[-10rem] top-[-8rem] -z-10 h-[32rem] w-[32rem] rounded-full bg-lagoon/20 blur-3xl" />

      {/* Điểm nhấn tím nhẹ */}
      <div className="absolute bottom-[-12rem] left-[24%] -z-10 h-[25rem] w-[25rem] rounded-full bg-violet/12 blur-3xl" />

      <div className="page-shell grid min-h-[calc(100dvh-4.75rem)] gap-10 py-14 md:min-h-[42rem] md:py-16 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-14 lg:py-20">
        <div className="fade-up max-w-4xl">
          <span className="inline-flex items-center rounded-full border border-white/20 bg-white/12 px-3.5 py-2 text-xs font-extrabold uppercase tracking-wide text-white shadow-lg backdrop-blur-md">
            Nền tảng quản lý giải đấu
          </span>

          <h1 className="mt-6 max-w-4xl text-[clamp(2.75rem,6vw,4.75rem)] font-extrabold leading-[1.06] tracking-[-0.035em] text-white drop-shadow-[0_6px_22px_rgba(0,0,0,0.42)]">
            Tổ chức giải đấu chuyên nghiệp, rõ ràng và hiệu quả
          </h1>

          <p className="mt-6 max-w-2xl text-base font-medium leading-8 text-[#eaf4fa] drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)] sm:text-lg">
            TMS hỗ trợ ban tổ chức quản lý đăng ký, lịch thi đấu, đội tham
            gia, kết quả và bảng xếp hạng trong một hệ thống thống nhất.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/tournaments"
              className={cn(
                buttonVariants({ size: "lg" }),
                "min-h-12 bg-primary px-6 font-bold text-white shadow-[0_16px_34px_-16px_rgba(37,99,235,0.85)] hover:bg-primary-hover",
              )}
            >
              Khám phá giải đấu
              <ArrowRight className="size-4" />
            </Link>

            <button
              type="button"
              onClick={handleCreateTournament}
              className={cn(
                buttonVariants({
                  size: "lg",
                  variant: "outline",
                }),
                "min-h-12 border-white/30 bg-white/12 px-6 font-bold text-white shadow-lg backdrop-blur-md hover:border-white hover:bg-white hover:text-header",
              )}
            >
              Tạo giải đấu
              <PlayCircle className="size-4" />
            </button>
          </div>
        </div>

        <div className="fade-up rounded-[1.5rem] border border-white/20 bg-[#153f5f]/78 p-5 shadow-[0_28px_70px_-30px_rgba(0,0,0,0.7)] backdrop-blur-2xl sm:p-6">
          <div className="mb-5">
            <p className="text-xs font-extrabold uppercase tracking-wide text-lagoon">
              Tổng quan hệ thống
            </p>

            <h2 className="mt-2 text-xl font-extrabold text-white sm:text-2xl">
              Dữ liệu vận hành hiện tại
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {loading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-32 animate-pulse rounded-2xl border border-white/10 bg-white/10"
                  />
                ))
              : statItems.map((item) => (
                  <div
                    key={item.label}
                    className="group rounded-2xl border border-white/15 bg-white/11 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition duration-300 hover:-translate-y-1 hover:border-lagoon/50 hover:bg-white/15"
                  >
                    <div className="mb-4 flex size-9 items-center justify-center rounded-xl bg-lagoon/14 text-lagoon ring-1 ring-lagoon/20">
                      <item.icon className="size-5" />
                    </div>

                    <div className="text-3xl font-black text-accent drop-shadow-sm sm:text-4xl">
                      {item.value.toLocaleString("vi-VN")}
                    </div>

                    <p className="mt-2 text-xs font-semibold leading-5 text-[#e7f1f7] sm:text-sm">
                      {item.label}
                    </p>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;