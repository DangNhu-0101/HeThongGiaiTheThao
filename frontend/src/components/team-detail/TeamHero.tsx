import { Calendar, MapPin, Trophy, UserCheck, Users } from "lucide-react";
import type { TeamDetailInfo } from "@/types/Team";

const isImage = (value?: string) =>
  Boolean(value && /^(https?:\/\/|data:image\/|blob:|\/?uploads\/)/i.test(value));

const TeamHero = ({ info }: { info: TeamDetailInfo }) => {
  const logoText = info.logo || info.name.slice(0, 2).toUpperCase();

  return (
    <section className="relative overflow-hidden border-b-4 border-primary bg-header text-white">
      {info.banner ? (
        <img src={info.banner} alt={`Ảnh bìa ${info.name}`} className="absolute inset-0 h-full w-full object-cover opacity-35" />
      ) : null}
      <div className="absolute inset-0 bg-header/80" />
      <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 md:flex-row md:items-center md:px-8">
        <div className="flex flex-1 flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white/20 bg-white text-4xl font-black text-primary shadow-xl md:h-32 md:w-32">
            {isImage(info.logo) ? <img src={info.logo} alt={`Logo ${info.name}`} className="h-full w-full object-cover" /> : logoText}
          </div>
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
              <span className="rounded-md border border-blue-400/30 bg-blue-500/20 px-2 py-1 uppercase text-blue-100">{info.sport}</span>
              <span className="rounded-md border border-green-500/30 bg-green-500/20 px-2 py-1 text-green-100">{info.status}</span>
              <span className="rounded-md bg-white/10 px-2 py-1 text-white/80">{info.division}</span>
              {info.isFull ? <span className="rounded-md bg-red-500/20 px-2 py-1 text-red-100">Đội đã đủ thành viên</span> : null}
            </div>
            <h1 className="break-words text-4xl font-black uppercase tracking-wide">{info.name}</h1>
            <div className="flex flex-wrap gap-4 text-sm font-medium text-white/80">
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-accent" /> {info.location || "Chưa cập nhật địa phương"}</span>
              <span className="flex items-center gap-1"><Calendar className="h-4 w-4 text-accent" /> Thành lập {info.founded}</span>
              <span className="flex items-center gap-1"><UserCheck className="h-4 w-4 text-accent" /> Đội trưởng: {info.captainName || "Chưa cập nhật"}</span>
            </div>
            {info.description ? <p className="max-w-3xl text-sm leading-6 text-white/75">{info.description}</p> : null}
          </div>
        </div>

        <div className="grid w-full grid-cols-3 gap-3 md:w-auto">
          <Stat icon={Users} value={`${info.currentMembers}/${info.maxMembers || "?"}`} label="Thành viên" />
          <Stat icon={Trophy} value={String(info.overallStats.titles)} label="Danh hiệu" />
          <Stat icon={Calendar} value={info.registrationOpen ? "Mở" : "Đóng"} label="Đăng ký" />
        </div>
      </div>
    </section>
  );
};

const Stat = ({ icon: Icon, value, label }: { icon: typeof Users; value: string; label: string }) => (
  <div className="rounded-xl border border-white/10 bg-white/10 p-4 text-center backdrop-blur-md">
    <Icon className="mx-auto mb-2 h-5 w-5 text-white/80" />
    <div className="text-2xl font-black text-white">{value}</div>
    <div className="mt-1 text-xs font-semibold uppercase text-white/70">{label}</div>
  </div>
);

export default TeamHero;
