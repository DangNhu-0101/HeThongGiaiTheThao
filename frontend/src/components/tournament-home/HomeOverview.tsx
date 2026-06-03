import type React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2,
  CalendarDays,
  CreditCard,
  ExternalLink,
  FileText,
  Info,
  MapPin,
  Phone,
  ScrollText,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { Tournament, TournamentRuleInfo } from "@/pages/tournamentPage";

interface HomeOverviewProps {
  tournament: Tournament;
  ruleInfo?: TournamentRuleInfo | null;
}

const getText = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const getRawTournament = (tournament: Tournament) => tournament as unknown as Record<string, unknown>;

const getOrgName = (tournament: Tournament) => {
  const organizer = tournament.organizer;
  if (typeof organizer === "string") return organizer;
  if (organizer && typeof organizer === "object") {
    const org = organizer as { name?: string; orgName?: string };
    return org.orgName || org.name || "Ban tổ chức";
  }
  return tournament.organization?.orgName || tournament.organization?.name || "Ban tổ chức";
};

const formatDate = (value?: string) => {
  if (!value) return "Đang cập nhật";
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatDateTime = (value?: string) => {
  if (!value) return "Đang cập nhật";
  return new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatTime = (value?: string) => {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (value?: number) => {
  if (!value) return "Miễn phí";
  return `${value.toLocaleString("vi-VN")} VND/VĐV`;
};

const getRegistrationUrl = (tournament: Tournament) => {
  const raw = getRawTournament(tournament);
  return getText(raw.registrationFormUrl) || getText(raw.registrationUrl) || getText(raw.formRegistrationUrl);
};

const getEntryFee = (tournament: Tournament) => {
  const firstConfig = tournament.sportsConfig?.find((item) => item.feeEntry || item.feePerAthlete);
  return firstConfig?.feeEntry || firstConfig?.feePerAthlete || 0;
};

const getMaxTeams = (tournament: Tournament) => {
  const total = tournament.sportsConfig?.reduce((sum, item) => sum + (Number(item.maxTeams) || 0), 0) || 0;
  return total > 0 ? total : null;
};

const getContacts = (tournament: Tournament) => {
  const raw = getRawTournament(tournament);
  if (Array.isArray(raw.contacts)) {
    return raw.contacts
      .map((item) => item as { name?: string; phone?: string })
      .filter((item) => item.name || item.phone);
  }

  if (tournament.contactPerson?.name || tournament.contactPerson?.phone) {
    return [tournament.contactPerson];
  }

  const organization = tournament.organization;
  if (organization?.contactPerson || organization?.contactPhone) {
    return [{ name: organization.contactPerson || "Ban tổ chức", phone: organization.contactPhone || "" }];
  }

  return [];
};

const getExtraRegistrationNotes = (tournament: Tournament) => {
  const raw = getRawTournament(tournament);
  return [
    getText(raw.registrationNote),
    getText(raw.zaloGroupNote),
    getText(raw.bankTransferContent) && `Nội dung chuyển khoản: ${getText(raw.bankTransferContent)}`,
    getText(raw.paymentNote),
  ].filter(Boolean);
};

const InfoCard = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) => (
  <Card className="border-none bg-slate-50 shadow-sm">
    <CardContent className="flex items-start gap-4 p-5">
      <div className="shrink-0 rounded-xl bg-white p-3 text-sky-700 shadow-sm">{icon}</div>
      <div>
        <p className="mb-1 text-xs font-bold uppercase text-slate-500">{label}</p>
        <div className="font-semibold leading-snug text-slate-800">{value}</div>
      </div>
    </CardContent>
  </Card>
);

export function HomeOverview({ tournament, ruleInfo }: HomeOverviewProps) {
  const registrationUrl = getRegistrationUrl(tournament);
  const entryFee = getEntryFee(tournament);
  const maxTeams = getMaxTeams(tournament);
  const contacts = getContacts(tournament);
  const registrationNotes = getExtraRegistrationNotes(tournament);
  const rawTournament = getRawTournament(tournament);
  const formatDescription = ruleInfo?.formatDescription || getText(rawTournament.formatDescription);
  const ruleDescription = ruleInfo?.ruleDescription || getText(rawTournament.ruleDescription);
  const rulesText = [formatDescription, ruleDescription].filter(Boolean).join("\n\n");
  const startTime = formatTime(tournament.timeLine?.tournamentStart);
  const endTime = formatTime(tournament.timeLine?.tournamentEnd);

  const timelineEvents = [
    tournament.timeLine?.registrationStart && { time: formatDateTime(tournament.timeLine.registrationStart), name: "Mở đăng ký" },
    tournament.timeLine?.registrationEnd && { time: formatDate(tournament.timeLine.registrationEnd), name: "Hạn đăng ký" },
    tournament.timeLine?.tournamentStart && { time: formatDateTime(tournament.timeLine.tournamentStart), name: "Khai mạc" },
    tournament.timeLine?.tournamentEnd && { time: formatDateTime(tournament.timeLine.tournamentEnd), name: "Bế mạc" },
    tournament.galaConfig?.hasGala && tournament.galaConfig.time && { time: formatDateTime(tournament.galaConfig.time), name: "Gala Dinner" },
  ].filter(Boolean) as { time: string; name: string }[];

  return (
    <div className="my-8 grid grid-cols-1 gap-8">
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
            <CalendarDays className="h-6 w-6 text-sky-600" />
            Tổng quan giải đấu
          </h2>

          {tournament.videoUrl ? (
            <div className="aspect-video w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm">
              <iframe src={tournament.videoUrl} title="Trailer" className="h-full w-full" allowFullScreen />
            </div>
          ) : tournament.bannerUrl ? (
            <div className="aspect-video w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm">
              <img
                src={`http://localhost:5001/${tournament.bannerUrl.replace(/\\/g, "/").replace(/^\/+/, "")}`}
                alt={tournament.name}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-100 text-slate-400">
              Không có hình ảnh/video
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoCard icon={<Building2 className="h-6 w-6" />} label="Ban tổ chức" value={getOrgName(tournament)} />
          <InfoCard icon={<Users className="h-6 w-6" />} label="Đối tượng" value={tournament.targetAudience || "Đang cập nhật"} />
          <InfoCard
            icon={<MapPin className="h-6 w-6" />}
            label="Địa điểm thi đấu"
            value={tournament.venue || tournament.location || "Đang cập nhật"}
          />
          <InfoCard
            icon={<CalendarDays className="h-6 w-6" />}
            label="Thời gian thi đấu"
            value={`${formatDate(tournament.timeLine?.tournamentStart)}${startTime || endTime ? ` | ${startTime || "Đang cập nhật"} - ${endTime || "Đang cập nhật"}` : ""}`}
          />
        </div>
      </section>

      {timelineEvents.length > 0 ? (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/60">
            <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
              <CalendarDays className="h-5 w-5 text-sky-600" />
              Lịch trình sự kiện
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
            {timelineEvents.map((event, index) => (
              <div key={`${event.name}-${index}`} className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
                <p className="text-sm font-bold text-slate-800">{event.time}</p>
                <p className="mt-1 text-xs font-semibold uppercase text-slate-500">{event.name}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/60">
              <CardTitle className="flex items-center gap-2 text-lg text-sky-700">
                <Info className="h-5 w-5" />
                Giới thiệu giải đấu
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600 md:text-base">
                {tournament.description || "Chưa có mô tả chi tiết cho giải đấu này."}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/60">
              <CardTitle className="flex items-center gap-2 text-lg text-sky-700">
                <ScrollText className="h-5 w-5" />
                Thể thức & Quy định thi đấu
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                {rulesText || "Thể thức thi đấu đang được Ban tổ chức cập nhật."}
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card className="border-sky-100 bg-sky-50/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-sky-800">
                <CreditCard className="h-5 w-5" />
                Thông tin đăng ký
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {registrationUrl ? (
                <Button asChild className="h-10 w-full bg-sky-700 text-white hover:bg-sky-800">
                  <a href={registrationUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Form đăng ký
                  </a>
                </Button>
              ) : null}

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <p className="mb-1 text-xs font-bold uppercase text-slate-500">Hạn đăng ký</p>
                  <p className="font-bold text-slate-800">{formatDate(tournament.timeLine?.registrationEnd)}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-bold uppercase text-slate-500">Chỉ tiêu</p>
                  <p className="font-bold text-slate-800">{maxTeams ? `${maxTeams} đội/cặp` : "Đang cập nhật"}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-bold uppercase text-slate-500">Lệ phí</p>
                  <p className="text-xl font-extrabold text-sky-700">{formatCurrency(entryFee)}</p>
                </div>
              </div>

              {registrationNotes.length > 0 ? (
                <div className="space-y-2 border-t border-sky-100 pt-4 text-sm text-slate-700">
                  {registrationNotes.map((note, index) => (
                    <p key={index}>{note}</p>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-slate-800">
                <Phone className="h-5 w-5 text-sky-700" />
                Liên hệ hỗ trợ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contacts.length > 0 ? (
                contacts.map((contact, index) => (
                  <div key={`${contact.name}-${index}`} className="rounded-lg bg-slate-50 p-3">
                    <p className="font-bold text-slate-800">{contact.name || "Ban tổ chức"}</p>
                    {contact.phone ? <p className="mt-1 text-sm font-semibold text-sky-700">{contact.phone}</p> : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Vui lòng liên hệ Ban tổ chức để được hỗ trợ.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-amber-100 bg-amber-50/70 shadow-sm">
            <CardContent className="space-y-3 p-5 text-sm leading-relaxed text-amber-950">
              <div className="flex items-center gap-2 font-bold">
                <ShieldCheck className="h-5 w-5" />
                Lưu ý
              </div>
              <p>Sau khi bốc thăm chia bảng thi đấu, lệ phí đăng ký không hoàn lại dưới mọi hình thức.</p>
              <p>Quyết định cuối cùng trong trận đấu thuộc về trọng tài.</p>
            </CardContent>
          </Card>

          {tournament.prizes ? (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-slate-800">
                  <FileText className="h-5 w-5 text-sky-700" />
                  Giải thưởng
                </CardTitle>
              </CardHeader>
              <CardContent className="whitespace-pre-wrap p-5 pt-0 text-sm leading-relaxed text-slate-600">
                {tournament.prizes}
              </CardContent>
            </Card>
          ) : null}
        </aside>
      </section>
    </div>
  );
}
